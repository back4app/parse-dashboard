export default class CloudCodeChanges {

    constructor(){
      this.files = [];
    }
  
    addFile( fileName ) {
      this.files = this.files.filter(f => f !== fileName);
      this.files = [ ...this.files, fileName ];
    }
  
    getFiles() {
      return this.files;
    }
  
    removeFile(fileName) {
      // if fileName exists, then remove
      if (this.files.indexOf(fileName) !== -1) {
        this.files = this.files.filter((f) => f !== fileName);
      } else 
        this.files = [...this.files, fileName];
    }
  
  }