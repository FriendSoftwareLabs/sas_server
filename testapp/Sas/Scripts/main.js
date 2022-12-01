Application.run = function( msg )
{
	this.setApplicationName( 'SAS Demo' );
	
	var v = new View( { 
		title: 'SAS test',
		width: 320,
		height: 500
	} );
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}
