var fs = require('fs');

var express = require('express');
var app = express();

var url = require('url')

var exec = require('child_process').exec;
var sys = require("sys");

var multer = require('multer');
var upload = multer(
    { 
        limits: {
            fieldNameSize: 999999999,
            fieldSize: 999999999
        },
        dest: 'uploads/' }
    );
app.use(express.static('./'));
app.get('/', function(req, res){
    res.send(
        '<form action="/upload" method="post" enctype="multipart/form-data">'+
        '<input type="file" name="source">'+
        '<input type="submit" value="Upload">'+
        '</form>'
    );
});

app.post('/upload', upload.any(), function(req, res){
	console.log("TESTTESTTESTTESTTEST");	
    exec("python ~/nodejs/plz/test2.py");
    console.log(req.files);

    var tmp_path = req.files[0].path;

    var target_path = 'uploads/' + req.files[0].originalname;

    var src = fs.createReadStream(tmp_path);
    var dest = fs.createWriteStream(target_path);
    src.pipe(dest);
    src.on('end', function() { res.send("ok"); });
    src.on('error', function(err) { res.send({error: "upload failed"}); });

	console.log(req.body.style);
	
	var stylenum = req.body.style.split('/')[(req.body.style.split('/')).length-1].split('.')[0];
	//exec("python ~/nodejs/plz/test.py " + req.files[0].originalname + " " + req.body.style + " > test.txt");
	//console.log("python ~/nodejs/plz/test.py " + req.files[0].originalname + " " + req.body.style + " > test.txt");

console.log("python3 ~/dkeis/fast-neural-style/neural_style/neural_style.py eval --content-image " + "./uploads/" + req.files[0].originalname + " --model ~/nodejs/gitmul/node-express-multer-image-upload/juhong/saved-modles/" + stylenum + ".pth --output-image transfer/" + req.files[0].originalname.split('.')[0] + "-trans." + req.files[0].originalname.split('.')[1] + " --cuda 1");

exec("python3 ~/dkeis/fast-neural-style/neural_style/neural_style.py eval --content-image " + "./uploads/" + req.files[0].originalname + " --model ~/nodejs/gitmul/node-express-multer-image-upload/juhong/saved-modles/" + stylenum + ".pth --output-image ./transfer/trans-" + req.files[0].originalname + " --cuda 1");


});

app.get('/info', function(req, res){
    console.log(__dirname);
    res.send("image upload server: post /upload");
});

app.listen(3004);
console.log('started server on localhost...');
