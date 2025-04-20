const http = require('http');
const express = require('express');
const mysql = require('mysql2');
const { v4: uuidv4 } = require('uuid');
const methodOverride = require('method-override');

//const flash = require('connect-flash');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
//const multer = require('multer');
//const fs = require('fs');

// Generate a UUIDv4
const uniqueId = uuidv4();


const app = express();

app.use(methodOverride('_method'));


app.use(bodyParser.urlencoded({extended:true}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  port:'3307',
  user: 'root',
  password: 'root', // Your MySQL password
  database: 'lms' // Replace with your database name
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database.');
});








app.get('/', (req, res)=> {
    //res.render('index');
   res.render('login');
});


app.get('/login', (req, res)=> {
    res.render('login');
});

app.post('/submit-login-form', (req, res) => {
    // Access posted data from req.body
    const { username, password } = req.body;

     const query = 'SELECT u.user_id FROM users u, login l WHERE u.user_id = l.user_id and u.user_name = ? and l.user_login_id = ? ';
     db.query(query, [username,password], (err, results) => {
        if (err) {
          console.error('Error executing query:', err.stack);
          return res.status(500).json({ error: 'Database error' });
        }
        if (results.length > 0) {
          const user = results[0]; // contains user_id and user_name
          const userId = user.user_id;
          res.redirect(`/instructor-dashboard?id=${userId}&type=Instructor`);
        }else if(username === 'admin' && password === 'admin'){
          //req.session.username = username;
          //console.log(username);
          res.redirect('/dashboard?id=1&type=Adminstrator');
        }else{
           res.redirect('/login');
        }
     });
});


app.get('/dashboard', (req, res)=> {

  const usertype = req.query.type;
  const userid = req.query.id;

  if(usertype  == 'Adminstrator'){
    // First query: Get courses
    const courseQuery = 'SELECT course_code,course_name,course_created_at FROM courses ORDER BY course_name DESC';

    // Second query: Get enrollment
    const enrollQuery = 'SELECT count(*) as total_enrollemnt,c.course_name FROM `enrollment` e, `courses` c WHERE c.course_id = e.course_id GROUP BY e.course_id';

    //Third query:Get the topics with username
    const topicsQuery = 'SELECT t.topic_title,t.topic_created_at,t.topic_state,t.topic_posted_by_user_id,c.course_code,c.course_name, u.user_name FROM `topics` t, courses c, users u WHERE c.course_id = t.course_id and u.user_id = t.topic_posted_by_user_id'



    // Run both queries
    db.query(courseQuery, (err1, courseResult) => {
        if (err1) throw err1;

        db.query(enrollQuery, (err2, enrollResult) => {
            if (err2) throw err2;

          db.query(topicsQuery, (err3, topicResult) => {
            if (err3) throw err2;

            // Extract values
            //const userCount = userResult[0].userCount;
            //const courseCount = courseResult[0].courseCount;

              // Send both to EJS
                res.render('index', {
                    courseResult,
                    enrollResult,
                    topicResult,
                    usertype
                });
            });
        });
    });

  }else{
    res.redirect('/instructor-dashboard?id=${userid}&type=Instructor');
  }
});



app.get('/instructor-dashboard', (req, res) => {

 const userID = req.query.id;
 const usertype = req.query.type;

 // First query: Get user details
    const userQuery = 'SELECT user_name FROM users WHERE user_id= ?';

  // Second query: Get enrollment
    const enrollQuery = 'SELECT count(*) as total_enrollemnt,c.course_name FROM `enrollment` e, `courses` c WHERE c.course_id = e.course_id and e.user_id=? GROUP BY e.course_id';

  //Third query:Get the topics with username
    const topicsQuery = 'SELECT t.topic_title,t.topic_created_at,t.topic_state,t.topic_posted_by_user_id,c.course_code,c.course_name, u.user_name FROM `topics` t, courses c, users u WHERE c.course_id = t.course_id and u.user_id = t.topic_posted_by_user_id and u.user_id=?'




    db.query(userQuery, [userID], (err1, userresults) => {
      if (err1) throw err1;

      db.query(enrollQuery, [userID],(err2, enrollResult) => {
            if (err2) throw err2;

        db.query(topicsQuery,[userID], (err3, topicResult) => {
            if (err3) throw err2;

    
        const userdetail = userresults[0];
        res.render('dashboard', {
                    usertype,
                    userdetail,
                    enrollResult,
                    topicResult
        });

      });

      });

  });


});



app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});





app.listen(4000, ()=> {
    console.log('Server started on port 4000');
});