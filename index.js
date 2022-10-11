const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const upload = require("./middlewares/fileUpload");
const db = require("./connection/db");
const app = express();
const port = 3000;

app.use(flash());

app.use(
  session({
    secret: "cobacoba",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 2 * 60 * 60 * 1000, // 2 JAM
    },
  })
);

app.set("view engine", "hbs");
app.use("/assets", express.static(__dirname + "/assets"));
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(express.urlencoded({ extended: false }));

db.connect(function (err, client, done) {
  if (err) throw err; // tampilkan eror connect db
  app.get("/contact", (req, res) => {
    if (!req.session.user) {
      req.flash("danger", "silahkan login dulu!");
      return res.redirect("/login");
    }
    res.render("contact", {
      user: req.session.user,
      isLogin: req.session.isLogin,
    });
  });

  app.get("/myproject", (req, res) => {
    if (!req.session.user) {
      req.flash("danger", "silahkan login dulu!");
      return res.redirect("/login");
    }
    res.render("myproject", {
      user: req.session.user,
      isLogin: req.session.isLogin,
    });
  });

  app.get("/login", (req, res) => {
    res.render("login");
  });

  app.post("/login", (req, res) => {
    let { loginemail, loginpassword } = req.body;

    let query = `SELECT * FROM tb_user WHERE email='${loginemail}'`;
    // console.log(query);
    client.query(query, function (err, result) {
      if (err) throw err;
      if (result.rows.length == 0) {
        console.log("email belum terdaftar");
        req.flash("danger", "email belum terdaftar");
        res.redirect("/login");
        return;
      }

      console.log(result.rows[0].password);
      const isMatch = bcrypt.compareSync(
        loginpassword,
        result.rows[0].password
      );

      console.log(isMatch);

      if (isMatch) {
        console.log("login sukses");
        req.session.isLogin = true;
        req.session.user = {
          id: result.rows[0].id,
          name: result.rows[0].name,
          email: result.rows[0].email,
        };
        req.flash("success", "login berhasil");
        res.redirect("/");
      } else {
        console.log("password salah");
        req.flash("danger", "password salah");
        res.redirect("/login");
      }
    });
  });

  app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("login");
  });

  app.get("/register", (req, res) => {
    res.render("register");
  });
  app.post("/register", (req, res) => {
    let add = req.body;
    const hashPassword = bcrypt.hashSync(add.regisPassword, 10);
    // console.log(add);
    let queryAdd = `INSERT INTO tb_user(name, email, password)
      VALUES ('${add.regisName}','${add.regisEmail}','${hashPassword}');`;

    client.query(queryAdd, function (err, result) {
      if (err) throw err;
      res.redirect("/login");
    });
  });
  app.get("/", (req, res) => {
    console.log(req.session);
    const query =
      "SELECT tb_projects.id,tb_projects.name,tb_projects.start_date,tb_projects.end_date,tb_projects.description,tb_projects.technologies,tb_projects.image,tb_user.name as author,tb_user.id as author_id FROM tb_projects LEFT JOIN tb_user on tb_projects.user_id=tb_user.id ORDER BY id DESC;";
    client.query(query, function (err, result) {
      if (err) throw err; // eror query
      let data = result.rows;
      let dataBlog = data.map(function (item) {
        item.technologies = item.technologies.map((check) => {
          if (check != "undefined") {
            return check;
          } else {
            check = undefined;
          }
        });
        return {
          ...item,
          duration: getDistanceTime(
            new Date(item.start_date),
            new Date(item.end_date)
          ),
          isLogin: req.session.isLogin,
        };
      });
      let filterBlog;
      if (req.session.user) {
        filterBlog = dataBlog.filter(function (item) {
          return item.author_id === req.session.user.id;
        });
        // console.log(dataBlog);teneri ? if : else
        console.log(filterBlog);
      }
      let resultBlog = req.session.user ? filterBlog : dataBlog;
      res.render("index", {
        dataBlog: resultBlog,
        user: req.session.user,
        isLogin: req.session.isLogin,
      });
    });
  });

  app.post("/myproject", upload.single("uploadimage"), (req, res) => {
    let add = req.body;
    const userId = req.session.user.id;
    const image = req.file.filename;
    let queryAdd = `INSERT INTO tb_projects(name, start_date, end_date, description, technologies, image,user_id ) 
      VALUES ('${add.InputName}','${add.startdate}','${add.enddate}','${add.description}','{"${add.nodejs}","${add.reactjs}","${add.angular}","${add.vuejs}"}','${image}','${userId}')`;
    client.query(queryAdd, function (err, result) {
      if (err) throw err;
      res.redirect("/");
    });
    console.log(userId);
  });

  app.get("/detail/:id", (req, res) => {
    if (!req.session.user) {
      req.flash("danger", "silahkan login dulu!");
      return res.redirect("/login");
    }
    let id = req.params.id;
    let query = `SELECT * FROM tb_projects WHERE id=${id}`;

    client.query(query, function (err, result) {
      if (err) throw err; // eror query

      let data = result.rows;
      let dataBlog = data.map(function (item) {
        item.technologies = item.technologies.map((check) => {
          if (check != "undefined") {
            return check;
          } else {
            check = undefined;
          }
        });
        return {
          ...item,
          duration: getDistanceTime(
            new Date(item.start_date),
            new Date(item.end_date)
          ),
          start_date: getFullTime(new Date(item.start_date)),
          end_date: getFullTime(new Date(item.end_date)),
        };
      });
      res.render("detail", {
        user: req.session.user,
        isLogin: req.session.isLogin,
        dataBlog: dataBlog[0],
      });
    });
  });

  app.get("/delete-myproject/:id", (req, res) => {
    let id = req.params.id;
    let queryDelete = `DELETE FROM tb_projects WHERE id=${id}`;

    client.query(queryDelete, function (err, result) {
      if (err) throw err; // eror query
      res.redirect("/");
    });
  });

  app.get("/editproject/:id", (req, res) => {
    if (!req.session.user) {
      req.flash("danger", "silahkan login dulu!");
      return res.redirect("/login");
    }
    let id = req.params.id;
    let queryEdit = `SELECT * FROM tb_projects WHERE id=${id}`;

    client.query(queryEdit, function (err, result) {
      if (err) throw err; // eror query
      let data = result.rows;
      let dataBlog = data.map(function (item) {
        item.technologies = item.technologies.map((check) => {
          if (check != "undefined") {
            return check;
          } else {
            check = undefined;
          }
        });
        return {
          ...item,
          start_date: timeDate(new Date(item.start_date)),
          end_date: timeDate(new Date(item.end_date)),
        };
      });
      res.render("editproject", {
        user: req.session.user,
        isLogin: req.session.isLogin,
        data: dataBlog[0],
      });
    });
  });

  app.post("/editproject/:id", upload.single("uploadimage"), (req, res) => {
    let id = req.params.id;
    let edit = req.body;
    // const userId = req.session.user.id;
    const image = req.file.filename;
    let queryEdit = `UPDATE tb_projects 
    SET name='${edit.InputName}',start_date='${edit.startdate}',end_date='${edit.enddate}',description='${edit.description}',technologies='{"${edit.nodejs}","${edit.reactjs}","${edit.angular}","${edit.vuejs}"}',image='${image}'
    WHERE id='${id}'`;

    client.query(queryEdit, function (err, result) {
      if (err) throw err;
      res.redirect("/");
    });
  });
});
// durasi

function getDistanceTime(start, end) {
  let startDate = new Date(start);
  let endDate = new Date(end);

  let destance = endDate - startDate; //milisecon

  let milisecon = 1000;
  let seconInHours = 3600;
  let hoursInDay = 24;
  let dayInWeek = 7;
  let weekInMount = 4;
  let mountInYear = 12;

  let distenYear = Math.floor(
    destance /
      (milisecon *
        seconInHours *
        hoursInDay *
        dayInWeek *
        weekInMount *
        mountInYear)
  );
  let distenMount = Math.floor(
    destance / (milisecon * seconInHours * hoursInDay * dayInWeek * weekInMount)
  );
  let distenWeek = Math.floor(
    destance / (milisecon * seconInHours * hoursInDay * dayInWeek)
  );
  let distenDay = Math.floor(
    destance / (milisecon * seconInHours * hoursInDay)
  );

  if (distenYear > 0) {
    return `${distenYear} Year`;
  } else if (distenMount > 0) {
    return `${distenMount} Mount`;
  } else {
    return `${distenDay} Day`;
  }
}

function getFullTime(time) {
  let month = [
    "Januari",
    "Febuari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "Nopember",
    "Desember",
  ];

  let date = time.getDate();
  let monthIndex = time.getMonth();
  let year = time.getFullYear();

  let hours = time.getHours();
  let minutes = time.getMinutes();

  if (hours < 10) {
    hours = "0" + hours;
  } else if (minutes < 10) {
    minutes = "0" + minutes;
  }

  // 12 Agustus 2022 09.04
  let fullTime = `${date} ${month[monthIndex]} ${year}`;
  // console.log(fullTime);
  return fullTime;
}

function timeDate(time) {
  let date = time.getDate();
  let month = time.getMonth();
  let year = time.getFullYear();

  let hours = time.getHours();
  let minutes = time.getMinutes();

  if (month < 10) {
    month = "0" + month;
  } else {
    month = month;
  }

  if (date < 10) {
    date = "0" + date;
  } else {
    date = date;
  }
  // 12 Agustus 2022 09.04
  let fullTime = `${year}-${month}-${date}`;

  return fullTime;
}

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
