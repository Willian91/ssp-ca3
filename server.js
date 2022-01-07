if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY

//HTTP Server
//

const http = require('http');
//Utility that allows us to work with directory paths

const path = require('path');
//This is XML <-> JSON converter
const xml2js = require('xml2js');
//Parsing XML
const xmlParse = require('xslt-processor').xmlParse;
//Processing XSLT
const xsltProcess = require('xslt-processor').xsltProcess;
//Instantiating the server
const expressjs = require('express');
const router = expressjs.Router();
const server = http.createServer(router);

const express = require('express')
const app = express()
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)

app.set('view', 'ejs')
app.use(express.json())
app.use(express.static('public'))

app.get('/menu', function(req, res) {
  fs.readFile('items.json', function(error, data) {
    if (error) {
      res.status(500).end()
    } else {
      res.render('menu.ejs', {
        stripePublicKey: stripePublicKey,
        items: JSON.parse(data)
      })
    }
  })
})

app.post('/purchase', function(req, res) {
  fs.readFile('items.json', function(error, data) {
    if (error) {
      res.status(500).end()
    } else {
      const itemsJson = JSON.parse(data)
      const itemsArray = itemsJson.drinkItems.concat(itemsJson.menu)
      let total = 0
      req.body.items.forEach(function(item) {
        const itemJson = itemsArray.find(function(i) {
          return i.id == item.id
        })
        total = total + itemJson.price * item.quantity
      })

      stripe.charges.create({
        amount: total,
        source: req.body.stripeTokenId,
        currency: 'usd'
      }).then(function() {
        console.log('Charge Successful')
        res.json({ message: 'Successfully purchased items' })
      }).catch(function() {
        console.log('Charge Fail')
        res.status(500).end()
      })
    }
  })
})

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
