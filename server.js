const http = require('http');
const fs   = require('fs');
const util = require('util');
const proc = require('child_process');
const qs   = require("querystring");

var server = new http.Server();

function getExtType(ext){
	if (['html', 'htm', 'shtml', 'shtm', 'php', 'jsp'].indexOf(ext) != -1)
		return 'text/html';
	else if (['jpeg', 'jpg', 'ico'].indexOf(ext) != -1)
		return 'image/jpeg';
	else if (['png', 'gif', 'bmp'].indexOf(ext) != -1)
		return 'image/' + ext;
	else if (['xml'].indexOf(ext) != -1)
		return 'text/' + ext;
	else if (['json', 'pdf'].indexOf(ext) != -1)
		return 'application/' + ext;
	else if (['cgi'].indexOf(ext) != -1)
		return undefined;
	else
		return 'text/plain';
}

function solvePath(url,callback){
	var sov = {};
	sov.path = 'www/' + url.replace(/^\/+|\/+$/gm,'');
	var st = fs.stat(sov.path, (err,st)=>{
		if (st && st.isDirectory()) {
			var index = ['index.html', 'index.htm'];
			for (var i in index) {
				var p = sov.path + '/' + index[i];
				if (fs.existsSync(p)) {
					sov.path = p;
					st = fs.statSync(sov.path);
					break;
				}
			}
		}
		if (!(st && st.isFile())) {
			sov.stat = 404;
			sov.path = 'www/404.html';
		} else {
			sov.head = {'Content-type': 'text/plain'};
			sov.stat = 200;
		}
		var ext = sov.path.split('/').pop().split('.');
		ext = ext.length > 1 ? ext.pop() : '';
		var mtype = getExtType(ext);
		if (!mtype) {
			sov.cgi = sov.path;
			callback(undefined, sov);
			return;
		}
		sov.head = {'Content-type': mtype};
		callback(undefined, sov);
	});
}

server.on('request',(req,res)=>{
	console.log(req.method, req.url);
	var url = req.url.split('?', 2);
	var queryGet = url[1];
	url = url[0];
	function doResponse(query) {
		solvePath(url,(err,sov)=>{
			if (err) throw err;
			if (sov.cgi) {
				var envs = [
					'METHOD=' + req.method,
				]
				if (query)
					envs.push('QUERY_STRING=' + query);
				var cmdline = envs.join(' ');
				cmdline += ' ' + sov.cgi;
				proc.exec(cmdline, (err,stdout,stderr)=>{
					if (err) throw err;
					if (stderr) throw stderr;
					var lines = stdout.split('\n');
					var headLines = 0;
					for (var i in lines) {
						var lss = lines[i].split(':', 2);
						if (lss.length < 2)
							break;
						if (lss[0] == 'Status')
							sov.stat = parseInt(lss[0]);
						else
							sov.head[lss[0]] = lss[1];
						headLines += 1;
					}
					lines.splice(0, headLines);
					res.writeHead(sov.stat,sov.head);
					res.write(lines.join('\n'));
					res.end();
				});
			} else if (sov.path) {
				fs.readFile(sov.path, (err,data)=>{
					if (err) throw err;
					res.writeHead(sov.stat,sov.head);
					res.write(data);
					res.end();
				});
			} else {
				res.writeHead(sov.stat,sov.head);
				if (sov.data) res.write(sov.data);
				res.end();
			}
		});
	}
	if (req.method == 'POST') {
		var queryPost = '';
		req.on('data', (chunk)=>{
			queryPost += chunk;
		});
		req.on('end', ()=>{
			doResponse(queryPost);
		});
	} else {
			doResponse(queryGet);
	}
});
server.listen(8080);
