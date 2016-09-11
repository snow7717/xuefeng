$(function(){
    //根据选中的一级菜单ajax异步加载响应的二级菜单
    $("#parentcate").change(function(){
        $("#secondcate").empty();
        var pid=$(this).val();
        if(pid==""){
            $("#secondcate").empty();
        }else{
            $.get('/admin/secondcate/query',{'pid':pid},function(data,status){
                if(data.isError){
                    alert(data.message);
                }else{
                    var opt;
                    for(var i=0;i<data.length;i++){
                        opt='<option value='+data[i]._id+'>'+data[i].name+'</option>';
                        $("#secondcate").append(opt);
                    }
                }
            });
        }
    });
    
    $("#playbill").change(function(e){
        //获取上传的文件对象
        var file = e.target.files[0];
        //获取上传文件的名称
        var fileName=e.target.files[0].name;
        //获取上传文件的格式
        var format=fileName.split('.')[1];
        //设置上传文件保存到阿里oss的名称为时间戳加后缀名
        var uploadName=new Date().getTime()+'.'+format;
        //上传文件
        client.multipartUpload(uploadName, file).then(function (result) {
            console.log(result);
        }).catch(function (err) {
            console.log(err);
        });
    });
})