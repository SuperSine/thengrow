# -*- coding: utf-8 -*-
from flask import Blueprint,jsonify,g,request
from goose import Goose
from errors import InvalidUsage
import re
from db import *

general_api = Blueprint('general_api',__name__)


@general_api.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

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

def insert_wti(**kwargs):
	args = locals()['kwargs']
	article = args.get('article','')
	tags = args.get('tags')
	words = [s for s in re.findall(r'\b[a-zA-Z]+\b',article) if len(s) > 1]
	
	if len(words) < 1:
		raise InvalidUsage('No article content.',status_code = 401);

	try:
		tags = json.loads(tags)
	except ValueError:
		raise InvalidUsage('Illegal tags content.',status_code = 401);




@general_api.route("/wti/<method>",methods=['POST'])
def wti(method):
	functions = {
		'update': update_wti,
		'delete': delete_wti,
		'get': get_wti,
		'insert': insert_wti 
	}
