//引入express
var express=require("express");
var app=express();
//引入bodyParser用来格式化表单数据
var bodyParser = require('body-parser');
//引入cookie-parser来使用cookie
var cookieParser = require('cookie-parser');
//引入mongoose模块用来操作mongo数据库
var mongoose=require('mongoose');
//引入underscore模块可以用来更新数据
var underscore=require('underscore');
//引入moment模块用来格式化时间
app.locals.moment=require('moment');

//引入model模型
var user=require('./models/user');
var movie=require('./models/movie');

//设置模板引擎
app.set('view engine','jade');
//设置视图的根目录
app.set('views','./views');

//设置资源文件的存放位置
var serveStatic = require('serve-static');
app.use(serveStatic('public'));

//设置表单提交数据的格式化
app.use(bodyParser.urlencoded({extended: true}));

//使用session之前必须use一下cookieParser
app.use(cookieParser());
//使用session
app.use(session({
    secret:'imooc'
    //resave:false,
	//saveUninitialized:true
}));

//连接数据库
mongoose.connect('mongodb://localhost/imooc');

//设置服务端口为环境变量总的port，如果不存在就设置为3000
var port=process.env.PORT || 3000;

//启动服务并监听端口
app.listen(port);

console.log('server running at port: '+port);

/*
 * 设置“/”前台首页路由
 * 通过render方法将jade模板文件编译后返回给前台
 * render()函数有两个参数：
 * 第一个参数是要编译的jade模板文件的路径
 * 第二个参数是附带传递给模板文件的变量，
 * 传递的变量用一个json格式表示
 */
app.get('/',function(req,res){
    res.render('home/index',{'title':'home','user':req.session.user.name});
});

//前台电影列表页路由
app.get('/movie',function(req,res){
    //调用movie模型的fetch方法遍历数据传递给前台展示
    movie.fetch(function(err,data){
        if(err){
            console.log(err);
        }else{
            res.render('home/movie/index',{'title':'movie','movies':data});
        }
    });
});

//设置前台详情页路由
app.get('/movie/detail/:id',function(req,res){
    //获取参数中的id
    var id=req.params.id;
    //通过id获取数据并将数据发送给前台视图
    var data=movie.findById(id,function(err,data){
        res.render('home/movie/detail',{'title':'detail','movie':data});
    });
});

//展示用户注册界面的路由
app.get('/register',function(req,res){
    res.render('home/user/register',{'title':'register'});
});
//实现用户注册功能的路由
app.post('/doregister',function(req,res){
    /*
     * 拿到表单发送过来的数据
     * 表单数据可以通过req.body拿到
     */
    var postuser=req.body;
    
    //先验证数据库中是否有重名的用户存在
    user.find({name:postuser.name},function(err,data){
        if(data.length>0){
            //如果有重名用户存在则返回json格式的错误信息
            res.json({'isError':true,'message':'该用户名已经存在了，请换个用户名重新注册！'});
        }else if(postuser.password!=postuser.passwordrepeat){
            //如果两次输入的密码不一致则返回错误信息
            res.json({'isError':true,'message':'两次输入的密码不一致，请重新输入密码！'});
        }else{
            /*
             * 如果用户名可以使用
             * 就通过表单发送的数据实例化user模型
             */
            var newuser=new user({
                'name':postuser.name,
                'password':postuser.password
            });
            //将数据保存到数据库
            newuser.save(function(err,user){
                if(err){
                    console.log(err);
                }else{
                    //如果注册成功则保存用户session并返回成功信息
                    req.session.user=user;
                    res.json({'isError':false,'message':'注册成功，即将跳转到首页!'});
                }
            });
        }
    });
    
});

//用户登录的路由
app.get('/login',function(req,res){
    res.render('home/user/login',{'title':'login'});
});
//实现用户登录功能的路由
app.post('/dologin',function(req,res){
    //获取到表单提交的数据
    var postuser=req.body;
    /*
     * 通过findOne方法搜索指定的用户是否存在
     */
    user.findOne({name:postuser.name},function(err,data){
        if(data){
            /*
             * 如果用户存在则继续验证密码
             * 调用我们自己在schema中定义的comparePassword()方法进行验证
             */
            data.comparePassword(postuser.password,function(err,isMatch){
                if(err){
                    console.log(err);
                }else{
                    if(isMatch){
                        //如果密码匹配则跳转到首页
                        res.json({'isError':false,'message':'登录成功，即将进入首页！！'});
                    }else{
                        //如果密码不匹配则返回错误信息
                        res.json({'isError':true,'message':'密码错误！'});
                    }
                }
            });
        }else{
            //如果用户不存在则返回错误信息
            res.json({'isError':true,'message':'该用户不存在！'});
        }
    });
});

/*----后台路由----*/
//后台展示用户列表的路由
app.get('/admin/user',function(req,res){
    user.fetch(function(err,data){
        if(err){
            console.log(err);
        }else{
            res.render('admin/user/list',{'title':'user','users':data});
        }
    });
});

//后台电影列表页的路由
app.get('/admin/movie',function(req,res){
    //调用movie模型的fetch方法遍历数据传递给前台展示
    movie.fetch(function(err,data){
        if(err){
            console.log(err);
        }else{
            res.render('admin/movie/list',{'title':'movie','movies':data});
        }
    })
});

//展示后台添加页面的路由
app.get('/admin/movie/create',function(req,res){
    res.render('admin/movie/create',{'title':'movie'}); 
});
//后台执行添加操作的路由
app.post('/admin/movie/store',function(req,res){
    //获取到表单传递过来的数据
    var postmovie=req.body;
    var newmovie=new movie({
        'name':postmovie.name,
        'director':postmovie.director,
        'type':postmovie.type,
        'src':postmovie.src,
        'country':postmovie.country,
        'playbill':postmovie.playbill,
        'intro':postmovie.intro,
    });
    //调用save方法保存数据并在回调函数中重定向页面
    newmovie.save(function(err,data){
        if(err){
            console.log(err);
        }else{
            res.redirect('/admin/movie');
        }; 
    });
});

//更新某个记录获取该记录的路由
app.get('/admin/movie/edit/:id',function(req,res){
    var id=req.params.id;
    movie.findById(id,function(err,data){
        if(err){
            console.log(err);
        }else{
            res.send(data);
        }
    })
});
//执行更新操作的路由
app.put('/admin/movie/update/:id',function(req,res){
    //拿到表单提交过来的要修改的数据的_id
    var id=req.body.id;
    //拿到表单提交过来的数据
    var postmovie=req.body;
    //通过findById获取到要修改的那条数据
    movie.findById(id,function(err,data){
        if(err){
            console.log(err);
        }else{
            /*
             * 通过underscore模块的extend()方法用表单提交过来的新数据替换之前的数据
             * 该方法有两个参数，
             * 第一个参数是要被替换掉的旧的数据
             * 第二个参数是新的数据
             */
            newmovie=underscore.extend(data,postmovie);
            //通过save方法保存数据并在回调函数中进行页面重定向
            newmovie.save(function(err,data){
                if(err){
                    console.log(err);
                }else{
                    res.send('update successfully!');
                }; 
            });
        }
    });
});
//执行删除操作的路由
app.delete('/admin/movie/delete/:id',function(req,res){
    var id=req.params.id;
    movie.remove({_id:id},function(err,result){
        if(err){
            console.log(err);
        }else{
            //如果删除成功就给客户端返回一段json数据
            res.json({'message':'delete successfully!'});
        }
    });
});
