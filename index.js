//Allows to respond to HTTP requests, defines routing and renders the required content
const express = require('express'),
//Working with the file system (read and write files)
const fs = require('fs'),
//HTTP Server
const http = require('http'),
//Utility that allows us to work with directory paths
const path = require('path'),
//This is XML <-> JSON converter
const xml2js = require('xml2js'),
//Parsing XML
const xmlParse = require('xslt-processor').xmlParse,
//Processing XSLT
const xsltProcess = require('xslt-processor').xsltProcess;
//Instantiating Express
const router = express(),
//Instantiating the server
const server = http.createServer(router);
//Serving static content from "views" folder
router.use(express.static(path.resolve(__dirname, 'views')));
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

function XMLtoJSON(filename, cb) {
    const filepath = path.normalize(path.join(__dirname, filename));
    fs.readFile(filepath, 'utf8', function (err, xmlStr) {
        if (err) throw (err);
        xml2js.parseString(xmlStr, {}, cb);
    });
};

function JSONtoXML(filename, obj, cb) {
    const filepath = path.normalize(path.join(__dirname, filename));
    const builder = new xml2js.Builder();
    const xml = builder.buildObject(obj);
    fs.unlinkSync(filepath);
    fs.writeFile(filepath, xml, cb);
};

router.get('/html', function (req, res) {

    //Tell the user that the resource exists and which type that is
    res.writeHead(200, { 'Content-Type': 'text/html' });
    //read in the XML file
    const xml = fs.readFileSync('WillianCafe.xml', 'utf8'),
        //read in the XSL file
        xsl = fs.readFileSync('WillianCafe.xsl', 'utf8');

    //Parse the XML file
    const doc = xmlParse(xml),
        //Parse the XSL file
        stylesheet = xmlParse(xsl);
    //Performing XSLT
    const result = xsltProcess(doc, stylesheet);
    //Serve back the user

    res.end(result.toString());

});

router.post('/json', function (req, res) {

    console.log(req.body);

    function appendJSON(obj) {

        console.log(JSON.stringify(obj, null, " "))

        XMLtoJSON('WillianCafe.xml', function (err, result) {
            if (err) throw (err);

            result.menu.section[obj.sec_n].entry.push({ 'item': obj.item, 'price': obj.price });

            console.log(JSON.stringify(result, null, " "));

            JSONtoXML('WillianCafe.xml', result, function (err) {
                if (err) console.log(err);
            });

        });

    };

    appendJSON(req.body);

    res.redirect('back');

});

router.post('/post/delete', function (req, res) {

    console.log(req.body);

    function deleteJSON(obj) {

        console.log(obj)

        XMLtoJSON('WillianCafe.xml', function (err, result) {
            if (err) throw (err);

            console.log(obj.sec);
            console.log(obj.ent);
            console.log(result);

            delete result.menu.section[obj.sec].entry[obj.ent];

            JSONtoXML('WillianCafe.xml', result, function (err) {
                if (err) console.log(err);
            });
        });
    };

    deleteJSON(req.body);

    res.redirect('back');

});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function () {
    const addr = server.address();
    console.log('Server listening at', addr.address + ':' + addr.port)
});