"""Local-only unit tests. Run: python3 -m unittest discover -v"""
import json
import threading
import unittest
from http.server import ThreadingHTTPServer
from unittest.mock import patch
from urllib.request import Request, urlopen

import server

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
            self.assertEqual(response.status,200)

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
