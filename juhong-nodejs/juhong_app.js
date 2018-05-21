var express = require('express');
var fs = require('fs'); // file system, to save files
var request = require('request');
var url = require('url'); // to parse URL and separate filename from path
var progress = require('progress-stream'); // to have a progress bar during upload


var exec = require('child_process').exec;
var sys = require("sys");
var chile;
var temp;
var serverLoad = 0;
var content = new String("amber.jpg");

var bodyParser = require('body-parser')
var app = express();



var st = "";

var multer = require('multer'); // library to uplaod photos https://github.com/expressjs/multer

// storage used with Multer library to define where to save files on server, and how to save filename
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        console.log("######" + req);
	console.log("#####" + file);
        cb(null, file.originalname );
//+ getExtension(file));
    }
});

function getStyle(style){
	
	var st = ""
	
	if(style === "1") st = "candy.pth"
	if(style === "2") st = "mosaic.pth"
	if(style === "3") st = "starry-night.pth"
	if(style === "4") st = "udnie.pth"
	
	return st;
}

function getExtension(file) {
    // this function gets the filename extension by determining mimetype. To be exanded to support others, for example .jpeg or .tiff
    var res = '';
    if (file.mimetype === 'image/jpeg') res = '.jpg';
    if (file.mimetype === 'image/png') res = '.png';
    return res;
}

app.use(express.static('./')); // serve all files in root folder, such as index.html

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

console.log("!!!!" + bodyParser.json());

// initialize Multer with storage definition and other options like limit to file size that can be uploaded
var upload = multer({
    storage: storage,
    // limits: { fileSize: 1048576, files: 1 } // limit file size to 1048576 bytes or 1 MB
    //,fileFilter: // TODO limit types of files. currently can upload a .txt or any kind of file into uploads folder
}).fields([ // fields to accept multiple types of uploads
    { name: "fileName", maxCount: 1 } // in <input name='fileName' />
]);




	
// for input type=file
app.post('/uploads', function (req, res, next) {
  var prog = progress({time:100},function(progress){ // time:100 means will check progress every 100 ms, say to update progress bar
    // NOTE may need to increase accepted file size to see any kind of progress, might be too fast
     
    //console.log("prog =" + prog.body.style);
	

    var len = this.headers['content-length'];
    var transf = progress.transferred;
    var result = Math.round(transf/len * 100)+'%';
    //console.log("req.body = " + req.body); // writes progress to console. does not work with images from internet, only file uploads
    //if (result != '100%') res.send(result)
  });

//--------------------python start---------------

  	
  
   
  req.pipe(prog);
  prog.headers = req.headers;

    upload(prog, res, function (err) { // changed req to prog in order to track % upload progress
        
         exec("python3 ~/dkeis/fast-neural-style/neural_style/neural_style.py eval --content-image " + prog.files.fileName[0].path + " --model ~/dkeis/fast-neural-style/saved-models/" + getStyle(prog.body.style) +" --output-image transfer/node.jpg --cuda 1", function (error, stdout, stderr){
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			if(error !== null){
				console.log('error: ' + error);
			}

			temp = stdout.match(/(load average: )([0-9.]*)/);
			if(temp !== null){
				sys.puts(temp[2]);
			}else{
				sys.puts("asd");
				console.log("@@@@@@@@@@@@@@@@@@@");
				console.log();
				console.log();
				console.log();
			}
      
      res.write("<h1>result from file</h2><img style='max-width:30%' src='" + "transfer/node.jpg" + "'/><pre>"  + "</pre><a href='/'>Go back</a>");
      res.end();
		});
        
        
        if (err) {
            res.status(err.status || 500).json({ "error": { "status_code": err.status || 500, "message": err.code } });
            return;
        } else {

          // NOTE on what you can expect here
           console.log(req.file); // if using upload.single('yourInputName')
           console.log(req.files); // if using upload.fields([]); // array of input field names
           console.log(req.body); // if using a text field instead of file input, ex. to grab url from another site by path name

            if (prog.files.fileName) { // fileName comes from input element:   <input type="file" name="fileName">
				//console.log(prog.files.fileName.originalname);
                res.writeHead(200,{'Content-Type':'text/html'});
                var reqJSON = JSON.stringify(prog.files.fileName, null, 2); // pretty print the JSON for <pre> tag

                
                res.write("<h1>Uploaded from file</h2><img style='max-width:30%' src='" + prog.files.fileName[0].path + "'/><pre>" + reqJSON + "</pre><a href='/'>Go back</a>");
                //res.write("<h1>result from file</h2><img style='max-width:20%' src='" + "transfer/node.jpg" + "'/><pre>"  + "</pre><a href='/'>Go back</a>");
               // res.end();
                console.log("--------------------");
                console.log(prog.files.fileName[0].path);
            }
            else if (prog.body.imageUrl) {

              // the text field was used, so process the input type=text with regular node/express
                var download = function (uri, filename, callback) {
                    request.head(uri, function (err, res, body) {
                        console.log('content-type:', res.headers['content-type']);
                        console.log('content-length:', res.headers['content-length']);
                        request(uri).pipe(fs.createWriteStream('./uploads/' + filename)).on('close', callback);
                    });
                };

                // this is only available when submitting a text url, not by choosing file to upload
                var urlParsed = url.parse(prog.body.imageUrl);
                if (urlParsed.pathname){
                  var onlyTheFilename = urlParsed.pathname ? urlParsed.pathname.substring(urlParsed.pathname.lastIndexOf('/') + 1).replace(/((\?|#).*)?$/, '') : '';
                  //console.log(urlParsed)
                  var newFilename = onlyTheFilename + '-' + Date.now() + '-' + onlyTheFilename
                  var wholePath = 'uploads/' + newFilename;
                  download(urlParsed.href, newFilename, function () {
                    var reqJSON = JSON.stringify(wholePath, null, 2); // pretty print
                    res.end("<h1>Uploaded from URL</h2><img style='max-width:50%' src='" + wholePath + "'/><pre>" + reqJSON + "</pre><a href='/'>Go back</a>")
                    console.log("wholePath")
                    console.log(wholePath)


console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
console.log();
console.log();
                  });
                }
            }
        }
    });
});

app.listen(3004, function () {
    console.log("Working on port 3004");
});

//app.listen(8080, '114.70.234.172');
//console.log('server runnning');
