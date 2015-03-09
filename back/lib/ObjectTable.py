# -*- coding: utf-8 -*-

class ObjectTable(dict):

    update_func = {}
    delete_func = {}
    NONE_TAG = "0"    

    def __init__(self,obj):
        super(self.__class__, self).__init__(obj)

    def rec_update(self, other, **third):
        """Recursively update the dictionary with the contents of other and
        third like dict.update() does - but don't overwrite sub-dictionaries.
        
        Example:
        >>> d = RecursiveDictionary({'foo': {'bar': 42}})
        >>> d.rec_update({'foo': {'baz': 36}})
        >>> d
        {'foo': {'baz': 36, 'bar': 42}}
        """
        try:
            iterator = other.iteritems()
        except AttributeError:
            iterator = other
        self.iter_rec_update(iterator)
        self.iter_rec_update(third.iteritems())
        
    def rec_delete(self,other):
        try:
            iterator = other.iteritems()
        except AttributeError:
            iterator = other
        self.iter_rec_delete(iterator)

    def iter_rec_update(self, iterator):
        for (key, value) in iterator:
            if key in self and \
               isinstance(self[key], dict) and isinstance(value, dict) \
               and self.update_func.has_key(key) == False:
                self[key] = self.__class__(self[key])
                self[key].rec_update(value)
            else:
                func = self.update_func.get(key,lambda old,new:new)
                self[key] = func(self.get(key,None),value)
         
                
    def iter_rec_delete(self,iterator):
        for (key, value) in iterator:
            if key in self and \
               isinstance(self[key], dict) and isinstance(value, dict) \
               and self.delete_func.has_key(key) == False:
                self[key] = self.__class__(self[key])
                self[key].rec_delete(value)
            else:
                if self.has_key(key):
                    func = self.delete_func.get(key,False)
                    if func != False:
                        func(value,key)
                    else:
                        del self[key]


class SimpleTagsTable(dict):
    def __init__(self,obj):
        super(self.__class__, self).__init__(obj)

class SimpleWordsTable(dict):
    def __init__(self,obj):
        super(self.__class__, self).__init__(obj)

class TagsTable(ObjectTable):

    def __init__(self,obj):

        if type(obj) is WordsTable:
            self.from_words_table(obj)
        elif type(obj) is SimpleTagsTable:
            self.from_simple(obj)
        elif type(obj) is dict:
            self.update(obj)

    def from_words_table(self,obj):
        if type(obj) is not WordsTable:
            return False
        self.clear()
        for (word,info) in obj.items():
            for tag in info.get('_tags',list(self.NONE_TAG)):
                self.setdefault(tag,dict())
                self[tag][word] = {'_count':info['_count']}
        return self


    def to_simple(self):
        result = SimpleTagsTable()
        for (tag,words) in self.items():
            for (word,info) in words.items():
                result.setdefault(tag,dict())
                result[tag][word] = [ info['_count'] ]
        return result

    def from_simple(self,obj):
        if type(obj) is not SimpleTagsTable:
            return False
        self.clear()
        for (tag,words) in obj.items():
            for (word,info) in words.items():
                self.setdefault(tag,dict())
                self[tag][word] = { '_count':info[0] }
        return self


class WordsTable(ObjectTable):
    def _plusCount(self,old,last):
        return old + last;

    def _plusTags(self,old,last):
        if type(old) is not list:
            old = []
        if type(last) is list:
            old.extend(last)
        else:
            old.append(last)

        old = filter( lambda x : x != self.NONE_TAG, list( set(old) ))

        return old

    def _minusCount(self,last,key):
        self[key] = self[key] - last
        self[key] = 1 if self[key] < 1 else self[key]

    def _minusTags(self,last,key):
        old_set = set(self[key])
        last_set = set(last)
        self[key] = list( old_set.difference(last_set) )

    def __init__(self,obj):

        if type(obj) is TagsTable:
            self.from_tags_table(obj)
        elif type(obj) is SimpleWordsTable:
            self.from_simple(obj)
        elif type(obj) is dict:
            self.update(obj)

        self.update_func = {
            '_count':self._plusCount,
            '_tags': self._plusTags
        }

        self.delete_func = {
            '_count':self._minusCount,
            '_tags': self._minusTags
        }


    def from_tags_table(self,obj):
        if type(obj) is not TagsTable:
            return False
        self.clear()
        for (tag,words) in obj.items():
            for (word,info) in words.items():
                sub_res = self.setdefault(word,dict())
                sub_res.setdefault("_count",info["_count"])
                sub_res.setdefault("_tags",[])

                sub_res["_tags"].append(tag)
                sub_res["_tags"] = list( set(sub_res["_tags"]) )

        return self

    def to_simple(self):
        result = SimpleWordsTable()

        for (word,info) in self.items():
            result.set(word,[ info['_count'], info['_tags'] ])
        return result

    def from_simple(self,obj):
        if type(obj) is not SimpleWordsTable:
            return False
        self.clear()

        for (word,info) in obj.items():
            self.setdefault(word,dict())
            self[word]['_count'] = obj[word][0]
            self[word]['_tags']  = obj[word][1]

    def load(self):
        pass

    def merge(self,words_table):
        if type(words_table) is not WordsTable:
            return False
        self.rec_update(words_table)


    def de_merge(self,words_table):
        if type(words_table) is not WordsTable:
            return False
        self.rec_delete(words_table)


