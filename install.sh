#!/bin/bash

#
# Friend SAS Server installation script
#
# This script will install Friend SAS Server within an existing Friend Core
# installation. If you have not installed Friend Core, you must do it before
# running it (it will detect it and abort).
#
# This script installs the three components that turns Friend SAS Server into to life:
# The SAS server
#
# You will need TLS keys: if they are not already present for Friend Core,
# this script will offer you the option to create self-signed keys using
# openssl. After Friend SAS Server installation, Friend Core will run in TLS mode.
# Self-signed keys will generate a warning in your browser the first
# time you connect to your Friend machine : just proceed to the Workspace
# by ignoring it..
#

QUIT="Installation aborted. Please restart script to complete it."

# Installs Dialog if needed
PATH_TO_DIALOG=$(which dialog)
if [ ! -x "${PATH_TO_DIALOG}" ]; then
	echo "dialog not found, it will be installed"
	sudo apt-get install dialog
fi

# Welcome
	dialog --backtitle "Friend SAS Server installer" --yesno "\
Welcome to the Friend SAS Server installer.\n\n\
Do you want to proceed with installation?" 10 55
if [ $? -eq "1" ]; then
	echo "$QUIT"
	exit 1
fi

# node.js
echo "Checking for node and npm"

nv=$(node -v)
npm=$(npm -v)

# node exists
if [ -z $nv ]; then
    dialog --backtitle "Friend SAS Server installer" --msgbox "\
Friend SAS Server server requires node.js.\n\n\
This installer will exit. Please install node.js,\n\
then restart this script.\n\
\n\
Note #1: A useful tool for managing node is 'n',\n\
instructions at: https://github.com/tj/n\n\
Note #2: If you intend to run the servers as\n\
system services, make sure node is available\n\
globably, not just for the user ( for 'n', use sudo )" 17 65
    echo "Friend SAS Server installation aborted."
    exit 1
fi

# node version
if [[ "$nv" =~ ^v1[0-9]\.* ]]; then
    echo "Found compatible node.js version: $nv"
else
    dialog --backtitle "Friend SAS Server installer" --msgbox "\
Incompatible node version found: $nv.\n\
Required version is 10.x or higher.\n\
\n\
This installer will exit. Please update node,\n\
then restart this script." 11 60
    echo "Friend SAS Server installation aborted."
    exit 1
fi

# npm exists
if [ -z "$npm" ]; then
	dialog --backtitle "Friend SAS Server installer" --msgbox "\
node was found, but not npm. This is usually bad,\n\
please fix your node.js installation \n\
" 10 70
	echo "Friend SAS Server installation aborted."
	exit 1
fi

# Asks for friendup directory
FRIEND_FOLDER="/home/$USER/friendup/build"
#FRIEND_FOLDER="/opt/friendos"
while true; do
	temp=$(dialog --backtitle "Friend SAS Server installer" --inputbox "\
Please enter the path to the FriendUp directory." 11 60 "$FRIEND_FOLDER" --output-fd 1)
	if [ $? = "1" ]; then
		echo "$QUIT"
		exit 1
	fi
	if [ $temp != "" ]; then
		FRIEND_FOLDER="$temp"
	fi

	# Verifies the directory
	if [ ! -f "$FRIEND_FOLDER/cfg/cfg.ini" ]; then
		dialog --backtitle "Friend SAS Server installer" --msgbox "\
Friend was not found in this directory,\n\
or Friend was not properly installed." 10 50
	else
		break;
	fi
done

# setup relevant folders
CURR_FOLDER=$(pwd)
FC_SAS_FOLDER="$FRIEND_FOLDER/services/sas"

echo $CURR_FOLDER
echo $FC_SAS_FOLDER

mkdir -p $FC_SAS_FOLDER
cp -R $CURR_FOLDER/sasserver/* $FC_SAS_FOLDER
npm install promise-mysql2

# check for hello and presence config.js files
# and warn that they will not be overwritten
SAS_CFG_FILE="$FC_SAS_FOLDER/config.js"

if [ -f $SAS_CFG_FILE ]
then
	echo "Found SAS Server cfg"
	FOUND_SAS_CFG="SAS server config found at\n\
$SAS_CFG_FILE\n"
else
	# copy default config
	cp $CURR_FOLDER/sasserver/config.example.js $FC_SAS_FOLDER/config.js
fi


if [[ -f $SAS_CFG_FILE ]]
then
	dialog --backtitle "Friend SAS Server installer" --yesno "\
$FOUND_SAS_CFG\
\n\
Seems your config file already exist\n \
This instalation will overwrite existing config and \n\
make a backup of existing config in same directory with \n\
bckp suffix\n
\n\
Abort installer?" 20 75
	if [ $? -eq "0" ]; then
		echo "$QUIT"
		exit 1
	fi
fi

#backup last config
cp $SAS_CFG_FILE "$SAS_CFG_FILE.bckp"

# FriendCore config file
FUP_CFG_FILE="$FRIEND_FOLDER/cfg/cfg.ini"
DbName=""
DbHost=""
DbPort=""
DbUser=""
DbPass=""
IP="localhost"

# load friend core things

if [ -f $FUP_CFG_FILE ]
then
	#DbName=sed -nr "/^\[DatabaseUser\]/ { :l /^dbname[ ]*=/ { s/[^=]*=[ ]*//; p; q;}; n; b l;}" $FUP_CFG_FILE
	DbName=$(sed -nr "/^\[DatabaseUser\]/ { :l /^dbname[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" $FUP_CFG_FILE)
	DbHost=$(sed -nr "/^\[DatabaseUser\]/ { :l /^host[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" $FUP_CFG_FILE)
	DbPort=$(sed -nr "/^\[DatabaseUser\]/ { :l /^dbport[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" $FUP_CFG_FILE)
	DbUser=$(sed -nr "/^\[DatabaseUser\]/ { :l /^login[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" $FUP_CFG_FILE)
	DbPass=$(sed -nr "/^\[DatabaseUser\]/ { :l /^password[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" $FUP_CFG_FILE)
	
	echo "blabla" >> log.txt
fi

#echo "------->$DbName-----------$DbHost---" >> log.txt

# Checks if TLS keys are defined
NEWTLS="0"
SELFSIGNED="false"
if [ ! -f "$FRIEND_FOLDER/cfg/crt/key.pem" ]
then
	dialog --backtitle "Friend SAS Server installer" --msgbox "\
Friend SAS Server requires TLS/SSL to work.\n\n\
This script will now create them for you.\n\
Please answer the following questions..." 11 70

	# Call openssl to create the keys
	if [ ! -d "$FRIEND_FOLDER/cfg/crt" ]; then
		mkdir "$FRIEND_FOLDER/cfg/crt"
	fi
	echo "Calling openssl to create the keys."
	openssl req -newkey rsa:2048 -nodes -sha512 -x509 -days 3650 -nodes -out "$FRIEND_FOLDER/cfg/crt/certificate.pem" -keyout "$FRIEND_FOLDER/cfg/crt/key.pem"
	TLSNEW="1"
	SELFSIGNED="true"
else
	temp=$(openssl verify -CAfile "$FRIEND_FOLDER/cfg/crt/certificate.pem" -CApath "$FRIEND_FOLDER/cfg/crt/certificate.pem" "$FRIEND_FOLDER/cfg/crt/certificate.pem")
	if [ "$temp" == "$FRIEND_FOLDER/cfg/crt/certificate.pem: OK" ]; then
		SELFSIGNED="true";
	fi
fi

# Asks for Friend SAS Server information
dialog --backtitle "Friend SAS Server installer" --msgbox "\
Friend SAS Service service will be installed.\n\
\n\
mySQL databases will be added for the services.\n\
\n\
The installer will now ask for all the necessary\n\
information and then set things up within Friend." 19 60

while true; do
	temp=$(dialog --backtitle "Friend SAS Server installer" --inputbox "\
Friend SAS Server server database.\
Please enter host of the Friendup database." 11 60 "$DbHost" --output-fd 1)
	if [ $? = "1" ]; then
		echo "$QUIT"
		exit 1
	fi
	if [ "$temp" != "" ]; then
		DbHost="$temp"
	fi
	
	temp=$(dialog --backtitle "Friend SAS Server installer" --inputbox "\
Friend SAS Server server database.\
Please enter the name of the Friendup database." 11 60 "$DbName" --output-fd 1)
	if [ $? = "1" ]; then
		echo "$QUIT"
		exit 1
	fi
	if [ "$temp" != "" ]; then
		DbName="$temp"
	fi
	
	# db user
	temp=$(dialog --backtitle "Friend SAS Server installer" --inputbox "\
Friend SAS Server server database.\n\n\
Please enter a mysql user name for the Friendup,\n\
server database. It can be an existing user name or,\n\
a new one but must be different from 'root'." 13 65 "$DbUser" --output-fd 1)
	if [ $? = "1" ]; then
		echo "$QUIT"
		exit 1
	fi
	if [ "$temp" != "" ]; then
		DbUser="$temp"
	fi
	
	# db pass
	temp=$(dialog --backtitle "Friend SAS Server installer" --inputbox "\
Friend SAS Server server database.\n\n\
Please enter the password\n\
for mysql user $DbUser:" 10 50 "$DbPass" --output-fd 1)
	if [ $? = "1" ]; then
		echo "$QUIT"
		exit 1
	fi
	if [ "$temp" != "" ]; then
		DbPass="$temp"
	fi

	# IP
	temp=$(dialog --backtitle "Friend SAS Server installer" --inputbox "\
Friend SAS Server server.\n\n\
Please enter IP of machine:" 10 50 "$IP" --output-fd 1)
	if [ $? = "1" ]; then
		echo "$QUIT"
		exit 1
	fi
	if [ "$temp" != "" ]; then
		IP="$temp"
	fi
	
	dialog --defaultno --backtitle "Friend SAS Server installer" --yesno "\
Using the following values for Friend SAS Server:\n\
\n\
Friend SAS Server database host: $DbHost\n\
Friend SAS Server database name: $DbName\n\
Friend SAS Server database username: $DbUser\n\
Friend SAS Server database password: $DbPass\n\
Friend SAS Server IP: $IP\n\
Please check the values and confirm..." 20 75
	if [ $? = "0" ]; then
		break;
	fi
done

# SAVE THE THINGS
# Saves setup.ini configuration file
#	DbName=$(sed -nr "/^\[DatabaseUser\]/ { :l /^dbname[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" $FUP_CFG_FILE)
#	DbHost=$(sed -nr "/^\[DatabaseUser\]/ { :l /^host[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" $FUP_CFG_FILE)
#	DbPort=$(sed -nr "/^\[DatabaseUser\]/ { :l /^dbport[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" $FUP_CFG_FILE)
#	DbUser=$(sed -nr "/^\[DatabaseUser\]/ { :l /^login[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" $FUP_CFG_FILE)
#	DbPass=$(sed -nr "/^\[DatabaseUser\]/ { :l /^password[ ]*=/ { s/.*=[ ]*//; p; q;}; n; b l;}" $FUP_CFG_FILE)

echo "install.ini written"

#jq '."host" = "$DbHost"' $SAS_CFG_FILE
#jq '."user" = "$DbUser"' $SAS_CFG_FILE
#jq '."password" = "$DbPass"' $SAS_CFG_FILE
#jq '."name" = "$DbName"' $SAS_CFG_FILE

# Generate config file


echo "server = {" > $SAS_CFG_FILE
echo "    type:"configuration"," >> $SAS_CFG_FILE
echo "    data:" >> $SAS_CFG_FILE
echo "    {" >> $SAS_CFG_FILE
echo "        websockets:" >> $SAS_CFG_FILE
echo "        {" >> $SAS_CFG_FILE
echo "            port:1337" >> $SAS_CFG_FILE
echo "        }," >> $SAS_CFG_FILE
echo "        database:" >> $SAS_CFG_FILE
echo "        {" >> $SAS_CFG_FILE
echo "            host: '$DbHost'," >> $SAS_CFG_FILE
echo "            user:'$DbUser'," >> $SAS_CFG_FILE
echo "            password:'$DbPass'," >> $SAS_CFG_FILE
echo "            name: '$DbName'" >> $SAS_CFG_FILE
echo "        }," >> $SAS_CFG_FILE
echo "        ip : '$IP'" >> $SAS_CFG_FILE
echo "    }" >> $SAS_CFG_FILE
echo "};" >> $SAS_CFG_FILE
echo "" >> $SAS_CFG_FILE
echo "module.exports = server;" >> $SAS_CFG_FILE
echo "" >> $SAS_CFG_FILE

module.exports = server;

# SYSTEMD
#--------
#installs new systemd script, starts it and enables autostart, arguments:
# $1 - path to executable
# $2 - service file name (no spaces)
# $3 - service description
function install_systemd_service(){
	USER=`whoami`
	NAME=$2
	TMP=/tmp/${NAME}.service
	EXE=$1
	WORKDIR=$(dirname "${EXE}")
	DESCRIPTION=$3
	
	echo "Writing systemd script to temporary file $TMP"
	
	echo '[Unit]' > $TMP
	echo "Description=${DESCRIPTION}" >> $TMP
	echo 'After=network.target' >> $TMP
	
	echo '[Service]' >> $TMP
	echo 'Type=simple' >> $TMP
	echo "User=${USER}" >> $TMP
	echo "WorkingDirectory=${WORKDIR}" >> $TMP
	echo "ExecStart=${EXE}" >> $TMP
	echo 'Restart=always' >> $TMP
	echo 'RestartSec=3' >> $TMP
	
	echo '[Install]' >> $TMP
	echo 'WantedBy=multi-user.target' >> $TMP
	
	echo "Superuser password is required to copy $TMP to /etc/systemd/system and enable the service"
	sudo cp $TMP /etc/systemd/system/
	sudo systemctl enable ${NAME}
	
	echo 'Service is installed and enabled'
	echo "Use standard systemd commands to control the service:"
	echo "systemctl start ${NAME}"
	echo "systemctl stop ${NAME}"
	echo "systemctl restart ${NAME}"
}

USE_SYSD="0"
dialog --backtitle "Friend SAS Server installer" --yesno "\
Do you wish to set up systemd to run SAS Server as system service?\n
This requires superuser access on your system" 10 50
SAS_EXE=$FRIEND_FOLDER/services/sas/main.js
SAS_EXE_RUN=$FRIEND_FOLDER/services/sas/run.sh
sudo chmod u+x $SAS_EXE

if [ $? -eq "0" ]; then
	USE_SYSD="1"
	# Generate run file sas
	echo '#!/bin/sh' > $SAS_EXE_RUN
	echo 'node main.js' >> $SAS_EXE_RUN
	chmod 555 $SAS_EXE_RUN
	# Generate systemd scripts
	install_systemd_service "${SAS_EXE_RUN}" "sas-server" "SAS Server server"
else
	echo "systemd setup declined"
fi

COMPLETE_MSG=""
if [ "$USE_SYSD" == "1" ]; then
	COMPLETE_MSG="To start the servers use:\nsudo systemctl start sas-server\n\nTo start automatically at boot:\nsudo systemctl enable sas-server\n"
fi

dialog --backtitle "Friend SAS Server installer" --msgbox "Installation complete!\n\n$COMPLETE_MSG\n\n" 20 70
exit 0
