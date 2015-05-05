# codepath-dropbox

This is a basic Dropbox clone to sync files across multiple remote folders.

Time spent: `10`

### Features

#### Required

- [x] Client can make GET requests to get file or directory contents
- [x] Client can make HEAD request to get just the GET headers 
- [x] Client can make PUT requests to create new directories and files with content
- [x] Client can make POST requests to update the contents of a file
- [x] Client can make DELETE requests to delete files and folders
- [x] Server will serve from `--dir` or cwd as root
- [x] Client will sync from server over TCP to cwd or CLI `dir` argument

### Optional

- [ ] Client and User will be redirected from HTTP to HTTPS
- [ ] Server will sync from client over TCP
- [ ] Client will preserve a 'Conflict' file when pushed changes preceeding local edits
- [ ] Client can stream and scrub video files (e.g., on iOS)
- [ ] Client can download a directory as an archive
- [ ] Client can create a directory with an archive
- [ ] User can connect to the server using an FTP client


### Walkthrough

![Video Walkthrough](https://vimeo.com/user39231823/videos)



#Commands run
````
//get folder contents
curl -v http://localhost:8000/


//get file contents
curl -v http://localhost:8000/index.js


//Client can make HEAD request to get just the GET headers
curl -v http://localhost:8000/index.js --head


//Client can make PUT requests to create new directories and files with content
curl -v http://localhost:8000/test -X PUT
curl -v http://localhost:8000/test/abc -X PUT


//Client can make PUT requests to create new directories and files with content
curl -v http://localhost:8000/test/data.txt -d "codepath is the best " -X PUT 

//Client can make PUT requests to create new directories and files with content
curl -v http://localhost:8000/test/data.txt -d "codepath's Node training is the best" -X PUT 


//Client can make DELETE requests to delete files and folders
curl -v http://localhost:8000/test/data.txt  -X DELETE 

curl -v http://localhost:8000/test/ -X DELETE

````
[![solarized dualmode](https://github.com/gabhi/codepath-dropbox/blob/master/codepath-dropbox.gif)]
