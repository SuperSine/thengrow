# -*- coding: utf-8 -*-
from flask import Blueprint,jsonify,g,request
from goose import Goose

general_api = Blueprint('general_api',__name__)

#get a cleaned article
@general_api.route("/getarticle/",methods=['GET'])
def getArticle():
	url = request.args.get('url')
	g = Goose()
	article = g.extract(url=url)
	return jsonify({'title':article.title,\
					'meta_description':article.meta_description,\
					'cleaned_text':article.cleaned_text,\
					'top_image':article.top_image.src})