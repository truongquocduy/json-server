const fs = require('fs')
const bodyParser = require('body-parser')
const jsonServer = require('json-server')
const jwt = require('jsonwebtoken')

const server = jsonServer.create()

const router = jsonServer.router('./db.json')

const db = JSON.parse(fs.readFileSync('./db.json', 'UTF-8'))

const middlewares = jsonServer.defaults();
const PORT = process.env.PORT || 3000;


server.use(middlewares);


server.use(jsonServer.defaults());
server.use(bodyParser.urlencoded({extended: true}))
server.use(bodyParser.json())

const SECRET_KEY = '123456789'
const expiresIn = '24h'

function createToken(payload) {
    return jwt.sign(
        payload, 
        SECRET_KEY, 
        {expiresIn})
}

function verifyToken(token) {
    return jwt.verify(
        token, 
        SECRET_KEY,  
        (err, decode) => decode !== undefined ?  decode : err)
}

function isAuthenticated({id, password}){
    return db.accounts.findIndex(account => account.id === id && account.password === password) !== -1
}
//Tạo account
server.post('/register', (req, res) => {
  const {id, password, date} = req.body;

  exist_account = db.accounts.findIndex(x => x.id === id)
  if(exist_account !== -1) {
    return res.status(401).json({
      status: 401,
      message: "Mssv đã tồn tại!",
    })
  }

  const new_account = {
    id,
    password,
    date
  }

  db.accounts.push(new_account);
  fs.writeFileSync('./db.json', JSON.stringify(db), () => {
    if (err) return console.log(err);
    console.log('writing to ' + fileName);
  })
  res.status(201).json({
    status: 201,
    message: "Success",
    data: new_account
  })
})
//login
server.post('/login', (req, res) => {
    // const {email, password} = req.body
    const id = req.body.id
    const password = req.body.password

    if (isAuthenticated({id, password}) === false) {
      const status = 401
      const message = 'Id hoặc password không đúng'
      res.status(status).json({status, message})
      return
    }
    const access_token = createToken({id, password})
    res.status(200).json({
      status: 200,
      message: "Success",
      data: {
        access_token
      }
    })
})
//Kiểm tra Token
server.use('/auth',(req, res, next) => {
  if (req.headers.authorization == undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Bad authorization header'
    res.status(status).json({status, message})
    return
  }
  try {
    let verifyTokenResult;
     verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

     if (verifyTokenResult instanceof Error) {
       const status = 401
       const message = 'Error: access_token is not valid'
       res.status(status).json({status, message})
       return
     }
     next()
  } catch (err) {
    const status = 401
    const message = 'Token đã hết hạn'
    res.status(status).json({status, message})
  }
})


//view all account
server.get('/auth/accounts', (req, res) => {
  res.status(200).json({
    status: 200,
    data: {
      "accounts" : db.accounts
    }
  })
})

//Xem account theo id
server.get('/auth/accounts/:id', ((req, res)=> {
  //let userdb = JSON.parse(fs.readFileSync('./database.json', 'UTF-8'));
	const id = req.params.id;
 
	const exist_id = db.accounts.findIndex(account =>  account.id == id)
	const result = db.accounts.filter(account =>  account.id == id)
	if (exist_id !== -1)
	{
		const status = 200
		return res.status(status).json({status, result})
	} else {
    return res.status(401).json({
      status: 401,
      message: "Mssv không tồn tại",
    })
}}))
//update account by id

server.patch('/auth/accounts/:id', (req, res) => {
  const account_id = req.params.id
  const password = req.body.password
  const date = req.body.date


  const exist_account = db.accounts.findIndex(account => account.id == account_id)
  if(exist_account !== -1) {
    db.accounts[exist_account].password = password
    db.accounts[exist_account].date = date

    fs.writeFileSync('./db.json', JSON.stringify(db), () => {
      if (err) return console.log(err);
      console.log('writing to ' + fileName);
    })

    res.status(200).json({
      status: 200,
      message: "Success",
      data: {
        'account': db.accounts[exist_account]
      }
    })
  } else {
    res.status(401).json({
      status: 401,
      message: "Id không tồn tại !",
    })
  }

})

//delete account by id
server.delete('/auth/accounts/:id', (req, res) => {
  const id = req.params.id

  const exist_id = db.accounts.findIndex(account =>  account.id == id)
  if(exist_id !== -1) {
    db.accounts.splice(exist_id, 1);

    fs.writeFileSync('./db.json', JSON.stringify(db), () => {
      if (err) return console.log(err);
      console.log('writing to ' + fileName);
    })

    return res.status(204).json({
      status: 204,
      message: "Success",
    })
  } else {
    return res.status(401).json({
      status: 401,
      message: "Id không tồn tại",
    })
  }

})

//view all user
server.get('/auth/users', (req, res) => {
  res.status(200).json({
    status: 200,
    message: "Success",
    data: {
      "users" : db.users
    }
  })
})

//view user by id
server.get('/auth/users/:id', (req, res) => {
  const user_id = req.params.id

  const exist_user = db.users.findIndex(user => user.id == user_id)
  if(exist_user !== -1) {
      res.status(200).json({
            status: 200,
            data: {
              'user': db.users[exist_user]
            }
          })
    } else {
      return res.status(401).json({
        status: 401,
        message: "User không tồn tại",
      })
    }
  })

//add new user
server.post('/auth/users', (req, res) => {
  const {id, name,classroom,gender,image,birth,address,phone,email} = req.body
  const exist_user = db.users.findIndex(user => user.id === id)

  if(exist_user !== -1) {
    return res.status(401).json({
      status: 401,
      message: "Id đã tồn tại",
    })
  }

    const new_user = {
      id,
      name,
      classroom,
      gender,
      image,
      address,
      phone,
      email
    }
  
    db.users.push(new_user);
    fs.writeFileSync('./db.json', JSON.stringify(db), () => {
      if (err) return console.log(err);
      console.log('writing to ' + fileName);
    })
    return res.status(200).json({
      status: 200,
      message: "Success",
      data: new_user
    })
})

//delete user by id
server.delete('/auth/users/:id', (req, res) => {
  const user_id = req.params.id

  const exist_user = db.users.findIndex(user => user.id == user_id)
  if(exist_order !== -1) {
    db.users.splice(exist_user, 1);

    fs.writeFileSync('./db.json', JSON.stringify(db), () => {
      if (err) return console.log(err);
      console.log('writing to ' + fileName);
    })

    return res.status(204).json({
      status: 204,
      message: "Success",
    })
  } else {
    return res.status(401).json({
      status: 401,
      message: "Id không tồn tại",
    })
  }

})

//update user by id
server.patch('/auth/users/:id', (req, res) => {
  const user_id = req.params.id
  const name = req.body.name
  const classroom = req.body.classroom
  const gender = req.body.gender
  const image = req.body.image
  const birth = req.body.birth
  const address = req.body.address
  const email = req.body.email

  const exist_user = db.users.findIndex(user => user.id == user_id)
  if(exist_user !== -1) {
    db.users[exist_user].id = user_id
    db.users[exist_user].name = name
    db.users[exist_user].classroom = classroom
    db.users[exist_user].gender = gender
    db.users[exist_user].image = image
    db.users[exist_user].birth = birth
    db.users[exist_user].address = address
    db.users[exist_user].email = email

    fs.writeFileSync('./db.json', JSON.stringify(db), () => {
      if (err) return console.log(err);
      console.log('writing to ' + fileName);
    })

    res.status(200).json({
      status: 200,
      message: "Success",
      data: {
        'user': db.users[exist_user]
      }
    })
  } else {
    res.status(401).json({
      status: 401,
      message: "Id không tồn tại!!",
    })
  }

})
//---------------------------------------------------------------------
// get all courses
server.get('/courses', (req, res) => {
  res.status(200).json({
    status: 200,
    message: "Success",
    data: {
      "courses" : db.courses
    }
  })
})
//get course by id
server.get('/courses/:id', (req, res) => {
  const course_id = req.params.id

  const exist_courses = db.courses.findIndex(course => course.id == course_id)
  if(exist_courses !== -1) {
      res.status(200).json({
            status: 200,
            data: {
              'course': db.courses[exist_courses]
            }
          })
    } else {
      return res.status(401).json({
        status: 401,
        message: "Id không tồn tại",
      })
    }
  })
//---------------------------------------------------------------------
// get all blogs
server.get('/auth/blogs', (req, res) => {
  res.status(200).json({
    status: 200,
    message: "Success",
    data: {
      "blogs" : db.blogs
    }
  })
})
//get blog by id
server.get('/auth/blogs/:id', (req, res) => {
  const blog_id = req.params.id

  const exist_blog = db.blogs.findIndex(blog => blog.id == blog_id)
  if(exist_blog !== -1) {
      res.status(200).json({
            status: 200,
            data: {
              'blog': db.blogs[exist_blog]
            }
          })
    } else {
      return res.status(401).json({
        status: 401,
        message: "Id không tồn tại",
      })
    }
  })
//---------------------------------------------------------------------
// get all blogdetails
server.get('/auth/blogdetails', (req, res) => {
  res.status(200).json({
    status: 200,
    message: "Success",
    data: {
      "blogdetails" : db.blogdetails
    }
  })
})
//get blogdetail by id
server.get('/auth/blogdetails/:id', (req, res) => {
  const blog_id = req.params.id

  const exist_blog = db.blogdetails.findIndex(blog => blog.id == blog_id)
  if(exist_blog !== -1) {
      res.status(200).json({
            status: 200,
            data: {
              'blogdetail': db.blogdetails[exist_blog]
            }
          })
    } else {
      return res.status(401).json({
        status: 401,
        message: "Id không tồn tại",
      })
    }
  })
//---------------------------------------------------------------------
// get all comments
server.get('/auth/comments', (req, res) => {
  res.status(200).json({
    status: 200,
    message: "Success",
    data: {
      "comments" : db.comments
    }
  })
})
//get comment by id
server.get('/auth/comments/:id', (req, res) => {
  const comment_id = req.params.id

  const exist_comment = db.comments.findIndex(comment => comment.id == comment_id)
  if(exist_comment !== -1) {
      res.status(200).json({
            status: 200,
            data: {
              'comment': db.comments[exist_comment]
            }
          })
    } else {
      return res.status(401).json({
        status: 401,
        message: "Id không tồn tại",
      })
    }
  })
//---------------------------------------------------------------------
// get all schedules
server.get('/auth/schedules', (req, res) => {
  res.status(200).json({
    status: 200,
    message: "Success",
    data: {
      "comments" : db.comments
    }
  })
})
//get schedules by id
server.get('/auth/schedules/:id', (req, res) => {
  const schedule_id = req.params.id

  const exist_schedule = db.schedules.findIndex(schedule => schedule.id == schedule_id)
  if(exist_schedule !== -1) {
      res.status(200).json({
            status: 200,
            data: {
              'schedule': db.schedules[exist_schedule]
            }
          })
    } else {
      return res.status(401).json({
        status: 401,
        message: "Id không tồn tại",
      })
    }
  })
//---------------------------------------------------------------------
// get all studyings
server.get('/auth/studyings', (req, res) => {
  res.status(200).json({
    status: 200,
    message: "Success",
    data: {
      "studyings" : db.studyings
    }
  })
})
//get studyings by id
server.get('/auth/studyings/:id', (req, res) => {
  const studying_id = req.params.id

  const exist_studying = db.studyings.findIndex(studying => studying.id == studying_id)
  if(exist_studying !== -1) {
      res.status(200).json({
            status: 200,
            data: {
              'studying': db.studyings[exist_studying]
            }
          })
    } else {
      return res.status(401).json({
        status: 401,
        message: "Id không tồn tại",
      })
    }
  })




server.use(router)

server.listen(PORT, () => {
  console.log('Run Auth API Server')
})