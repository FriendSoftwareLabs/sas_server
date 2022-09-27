const promiseCallback = function pcb(functionName, params) {
	const targs = Array.prototype.slice.call(params, 0);
	return new Promise(((resolve, reject) => {
		// 箭头函数里面的this是当前上下文, 寻找最近的作用域链
		targs.push((err, ...args) => {
			if (err) {
				return reject(err);
			}
			return resolve.apply(this, [args]);
		});

		this[functionName](...targs);
	}));
};

module.exports = {
	promiseCallback,
};