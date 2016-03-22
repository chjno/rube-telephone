import subprocess
import json
import time
import sys

with open('creds.json', 'r') as credfile:
    auth = json.load(credfile)

ocrkey = auth['ocrkey']
# print ocrkey + "\n"

filename = sys.argv[1]
# print filename + "\n"

# if timeout or other error, exit script and use previous string
# if filename == ..., go on
timeout = time.time() + 3
while True:
  if filename == subprocess.check_output(["ls -t pics | head -1"], shell=True).rstrip():
    break
  elif time.time() > timeout:
    # print 'timeout filename: ' + filename
    sys.exit()

# print "file found\n"

# upload to newOCR
timeout = time.time() + 3
while True:
  data1 = subprocess.check_output(["curl -sH \"Expect:\" -F file=@./pics/%(filename)s http://api.newocr.com/v1/upload?key=%(ocrkey)s" % locals()], shell=True)
  json1 = json.loads(data1)
  if json1['status'] == u'success':
    break
  elif json1['status'] != u'success':
    # print time.time() + "\n"
    # print "ocr upload error\n"
    # print "filename: " + filename + "\n"
    sys.exit()
  elif time.time() > timeout:
    # print time.time() + "\n"
    # print "timeout upload\n"
    # print "filename: " + filename + "\n"
    sys.exit()

# print "file uploaded\n"

fileid = json1['data']['file_id'].encode('utf-8')

# print fileid + "\n"

# get results from newOCR
timeout = time.time() + 3
while True:
  data2 = subprocess.check_output(["curl -s \"http://api.newocr.com/v1/ocr?key=%(ocrkey)s&file_id=%(fileid)s&page=1&lang=eng&psm=6\"" % locals()], shell=True)
  json2 = json.loads(data2)
  if json2['status'] == u'success':
    break
  elif json2['status'] != u'success':
    # print time.time() + "\n"
    # print "ocr results error\n"
    # print "filename: " + filename + "\n"
    # print "fileid: " + fileid + "\n"
    sys.exit()
  elif time.time() > timeout:
    # print time.time() + "\n"
    # print "timeout results\n"
    # print "filename: " + filename + "\n"
    # print "fileid: " + fileid + "\n"
    sys.exit()

# print "result received"

ocr_text = json2['data']['text'].encode('utf-8')
print ocr_text


# error_log = open("error.txt", "w")
# error_log.write('')
# error_log.close()

# results_log = open("ocr.txt", "w")
# results_log.write(ocr_text)
# results_log.close()



# fswatch -o /Users/chino/itp-code/rube/ocrCam/pics | xargs -n1 python /Users/chino/itp-code/rube/ocrCam/ocr.py