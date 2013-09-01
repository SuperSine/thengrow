#!/usr/bin/env Python
 
def replace_string(string):
    values = {"a": "10", "b": "11", "c": "12", "d": "13", "e": "14", "f": "15", "g": "16", "h": "17", "i": "18", "j": "19", "k": "20", "l": "21", "m": "22", "n": "23", "o": "24", "p": "25", "q": "26", "r": "27", "s": "28", "t": "29", "u": "30", "v": "31", "w": "32", "x": "33", "y": "34", "z": "35", " ": "36", "?": "37", "!": "38", ",": "39", ".": "40"}
    output = ""
     
    for x in list(string):
        output += str(int(values.get(str.lower(x))))
         
    return output
     
def revert_string(string):
    values = {"10": "a", "11": "b", "12": "c", "13": "d", "14": "e", "15": "f", "16": "g", "17": "h", "18": "i", "19": "j", "20": "k", "21": "l", "22": "m", "23": "n", "24": "o", "25": "p", "26": "q", "27": "r", "28": "s", "29": "t", "30": "u", "31": "v", "32": "w", "33": "x", "34": "y", "35": "z", "36": " ", "37": "?", "38": "!", "39": ",", "40": "."}
    output = ""
    count = 0
    x = 0
     
    while count < len(string):
        output += str(values.get(string[count:(count+2)]))
        count += 2
         
    return output