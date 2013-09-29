from peewee import *

database = SqliteDatabase('minitwit.db', **{})
#database = MySQLDatabase('minitwit',user='root',passwd='123')


class UnknownFieldType(object):
    pass

class BaseModel(Model):
    class Meta:
        database = database

class Follower(BaseModel):
    who = IntegerField(null=True, db_column='who_id')
    whom = IntegerField(null=True, db_column='whom_id')
    follow = PrimaryKeyField(null=True,db_column='follow_id')

    class Meta:
        db_table = 'follower'

class Message(BaseModel):
    author = IntegerField(db_column='author_id')
    message = PrimaryKeyField(null=True, db_column='message_id')
    pub_date = IntegerField(null=True)
    text = TextField()

    class Meta:
        db_table = 'message'



class User(BaseModel):
    email = TextField()
    pw_hash = TextField()
    user = PrimaryKeyField(null=True, db_column='user_id')
    username = TextField()

    class Meta:
        db_table = 'user'

