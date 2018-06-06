# webart.work User Part
This part is designed to handle all waw apps user management.

## Login / Register / Socials connect
All this code is hosted in auth.js file, where you can find all links and code which get updated. There is sd.__sign array, which could be filled with any code from other parts, with below example.
``` javascript
// Your Part code
sd.__sign.push(function(customObj, cb){ // object pulled from user.part[PARTNAME]
  customObj.something = 'something else';
  cb(); // make sure you call this, overwise your push will be ignored.
});
```
Later in your part, to get that info from user, you simply use `user.part[PARTNAME]`.

## Working with this part
To use this part into your waw app, you can simply clone it and rename it to user for simplification. In this way you can have latest code from webart.work which handle user data.
