var head = document.getElementsByTagName('head')[0];
var js = document.createElement("script");

js.type = "text/javascript";
	js.src="build/bundle.js";
	head.appendChild(js);

// /*
//  *	Determine Chrome or NWjs
//  */
// try {
// 	// In NWjs
// 	if (typeof global !== undefined && global.window && global.window.nwDispatcher) {
// 		js.src = "index.js";
// 	} 
// 
// } catch (e) {
// 	// In Chrome
// 	js.src="build/bundle.js";
// 	head.appendChild(js);
// 	console.log(e);
// }
// 
// 
