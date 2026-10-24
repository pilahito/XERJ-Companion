"""Local-only unit tests. Run: python3 -m unittest discover -v"""
import json
import re
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch
from urllib.request import Request, urlopen

import server

BASE=Path(__file__).parent
CATALOG=json.loads((BASE/"i18n.json").read_text(encoding="utf-8"))
DYNAMIC_KEYS={"status.checking","status.online","status.offline","status.backend"}

class CompanionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.http=ThreadingHTTPServer(("127.0.0.1",0),server.Handler)
        cls.url="http://127.0.0.1:"+str(cls.http.server_port)
        cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.http.server_close()

    def test_frontend(self):
        with urlopen(self.url+"/") as response:
            html=response.read().decode()
            self.assertIn("XERJ Companion",html)
            self.assertIn('data-i18n="nav.search"',html)
            self.assertIn('id="tabs"',html)
            self.assertIn('data-i18n="rail.status.title"',html)
            self.assertEqual(response.status,200)

    def test_query_strings_serve_the_app(self):
        with urlopen(self.url+"/?demo=1") as response:
            self.assertEqual(response.status,200)
            self.assertIn("XERJ",response.read().decode())

    def test_i18n_endpoint(self):
        with urlopen(self.url+"/i18n.json") as response:
            self.assertEqual(response.headers.get_content_type(),"application/json")
            self.assertEqual(json.load(response),CATALOG)

    def test_i18n_catalogs_match(self):
        self.assertEqual(set(CATALOG),{"en","es"})
        self.assertEqual(set(CATALOG["en"]),set(CATALOG["es"]))
        for language,entries in CATALOG.items():
            for key,value in entries.items():
                self.assertIsInstance(value,str,key)
                self.assertTrue(value.strip(),key)
        self.assertEqual(CATALOG["es"]["nav.search"],"Buscar")
        self.assertNotEqual(CATALOG["en"]["nav.search"],CATALOG["es"]["nav.search"])

    def test_i18n_covers_markup_and_scripts(self):
        html=(BASE/"index.html").read_text(encoding="utf-8")
        script=(BASE/"app.js").read_text(encoding="utf-8")
        used=set(re.findall(r'data-i18n(?:-ph|-aria)?="([^"]+)"',html))
        used|=set(re.findall(r'\bt\("([^"]+)"',script))
        used|=set(re.findall(r'setKey\([^,]+,\s*"([^"]+)"\)',script))
        used|=set(re.findall(r'emptyBox\("([^"]+)"\)',script))
        used|=DYNAMIC_KEYS
        missing=sorted(used-set(CATALOG["es"]))
        self.assertEqual(missing,[],"keys absent from the catalogs")

    def test_index_validation(self):
        self.assertEqual(server.validate_index("my-index*"),"my-index*")
        for index in ("","../secret","abc/x","bad?index"):
            with self.assertRaises(ValueError):server.validate_index(index)

    def test_search_proxy(self):
        fake={"hits":{"hits":[{"_index":"demo","_id":"42","_score":1.0,"_source":{"text":"sample code"}}]}}
        with patch.object(server,"req",return_value=fake):
            body=json.dumps({"query":"checkpoint","index":"demo"}).encode()
            request=Request(self.url+"/api/search",data=body,headers={"Content-Type":"application/json"})
            with urlopen(request) as response:
                result=json.load(response)
        self.assertEqual(result["hits"][0]["source"]["text"],"sample code")

    def test_hardware(self):
        info=server.hardware()
        self.assertIn("suggested_model",info)
        self.assertIn(info["suggested_model"],server.MODELS)

if __name__=="__main__":
    unittest.main()
