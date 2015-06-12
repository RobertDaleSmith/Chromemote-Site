$( document ).ready(function(){

    initBlogNewBlogPost();

    initManageUsers();

    initManageAds();

    initDashStats();

});

function importMailChimp(){
    $.getJSON( "/members_export_12c331a157.json", function( data ) {
        // console.dir( data );
        for(var i=0; i<data.length; i++){            
            // console.log( data[i]["Full Name"] );
            // console.log( data[i]["Email Address"] );
            // console.log( data[i]["Donation Date"] );
            // console.log( "$"+data[i]["Donation Level"]+"\n" );
            var donations = [], name = data[i]["Full Name"], email = data[i]["Email Address"],
            donation_amount = data[i]["Donation Level"],
            date_added = data[i]["Donation Date"].replaceAll('-','/');            
            donations.push({date: date_added, amount: donation_amount, source: "paypal"});
            addNewUser(name, email, donations, date_added);
        }        
    });
}
String.prototype.replaceAll = function(target, replacement) { return this.split(target).join(replacement); };

  /////////////////////////////////
 //  Manage Users  ////////START//
function initManageUsers(){

    $('#donation_date_input').datepicker();

    $("#openAddUserModalBtn").click(function(){
        clearAddUserModal();
        setTimeout(function(){
            $("#add_user_name").focus();
        },750);
    });
    
    $("#add_user_email").blur(function(event){
        $("#gravatar_info .about").html("");
        $("#gravatar_info .name").html("");
        $("#gravatar_info .location").html("");

        $("#user_pic img").attr("src", "http://www.gravatar.com/avatar/"+ keyGen.getMd5($(this).val().toLowerCase()) +"?d=http://api.chromemote.com/images/user_placeholder.png" );
        $("#gravatarJson").remove();
        $("head").append("<script src='http://en.gravatar.com/"+ keyGen.getMd5($("#add_user_email").val().toLowerCase()) +".json?callback=gravatarUpdate' id='gravatarJson' type='text/javascript'></script>");
    });

    
    $("#edit_modal_key_view").click(function(event){
        $(this).select();
    });

    $("#donation_amount_input").keyup(function(event){
        if(event.keyCode == 13) $("#add_donation_button").click();
    });
    $("#donation_source_input").keyup(function(event){
        if(event.keyCode == 13) $("#add_donation_button").click();
    });
    $("#donation_date_input").keyup(function(event){
        if(event.keyCode == 13) $("#add_donation_button").click();
    });
    $("#add_donation_button").click(function(){
        var amount = $("#donation_amount_input").val();
        var source = $("#donation_source_input").val();
        var date   = $("#donation_date_input").val();
        if(date == "") {
            date = getTodaysDate();
            $("#donation_date_input").val(getTodaysDate());
        }
        if(amount == ""){
            $("#donation_amount_input").focus();
        } else {
            addDonation(amount, source, date);
            $("#donation_amount_input").focus();
            $("#donation_amount_input").val("");
            $("#donation_source_input").val("paypal");
            $("#donation_date_input").val(getTodaysDate());  
        }        
    }); 
    $("#save_new_user_button").click(function(){
        var name  = $("#add_user_name").val();
        var email = $("#add_user_email").val();
        if(name != "" && email != ""){
            var donations = [];
            var donationEls = document.getElementsByClassName("add_user_donation");
            for(var i=0; i < donationEls.length; i++){
                var amount = parseInt( donationEls[i].getElementsByClassName("add_user_donation_amount")[0].innerText.replace('$','') );
                var date = donationEls[i].getElementsByClassName("add_user_donation_date")[0].innerText;
                var source = donationEls[i].getElementsByClassName("add_user_donation_source")[0].innerText;
                console.log(amount + " " + date + " " + source);
                donations.push({date: date, amount: amount, source: source});
            }
            // console.dir(donations);

            if(updatingUser){                
                updateUser(updatingUserID, name, email, donations);                
                updatingUserID = "";
                updatingUser = false;
            } else {
                addNewUser(name, email, donations);
            }            
        }
        
    });

    $("#delete_user_confirm_btn").click(function(){
        var data = {};
        data.dbID = $("#userIDtoDeleteHolder").val();
        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: '/admin/users/remove',                                                
            success: function(data) {
                console.log('success');
                $("#"+$("#userIDtoDeleteHolder").val()).remove();               
            }
        });
    });  

    $("#cancel_new_user_button").click(function(){
        clearAddUserModal();
    });   

    $(".remove_donation").click(function(){
        $(this.parentNode).remove();
    });
}

function gravatarUpdate(data){    
    $("#gravatar_info .about").html(data.entry[0].aboutMe);
    if(data.entry[0].name.formatted) $("#gravatar_info .name").html(data.entry[0].name.formatted);
    else $("#gravatar_info .name").html(data.entry[0].displayName);
    $("#gravatar_info .location").html(data.entry[0].currentLocation);
}

function clearAddUserModal(){
    $("#add_user_name").val("");
    $("#add_user_email").val("");
    $("#user_pic img").attr("src", "http://www.gravatar.com/avatar/"+ "000" + "?d=http://api.chromemote.com/images/user_placeholder.png" );
    $("#donation_amount_input").val("");
    $("#donation_source_input").val("paypal");
    $("#donation_date_input").val(getTodaysDate());
    $("#edit_user_donation_list").text("");

    $("#gravatar_info .about").html("");
    $("#gravatar_info .name").html("");
    $("#gravatar_info .location").html("");

    updatingUserID = "";
    updatingUser = false;
}

function addDonation(amount, source, date){
    var donationHTML =  
        "<div class='add_user_donation well well-sm' style='margin-bottom: 4px;'>"+
            "<span class='add_user_donation_amount label label-success'>$" + amount + "</span>&nbsp;"+
            "<span class='add_user_donation_date'>" + date + "</span>&nbsp;"+
            "<span class='add_user_donation_source'>" + source + "</span>"+
            "<button name='includeicon' type='button' class='btn btn-default btn-sm remove_donation' value='1'><i class='glyphicon glyphicon-remove'></i></button>"+
        "</div>";

    $("#edit_user_donation_list").append(donationHTML);

    $(".remove_donation").unbind('click');
    $(".remove_donation").click( function(){
        $(this.parentNode).remove();
    });
}

function addNewUser(name, email, donations, date_added){   
    var data = {};
    data.name = name;
    data.email = email;
    data.donation  = donations;

    if(date_added!=null) data.date_added  = date_added;
    else {
        if(donations[0]) data.date_added = donations[0].date;
        else             data.date_added = getTodaysDate();
    }

    $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '/admin/users/new',                                                
        success: function(result) {
            console.log('success');
            $("#cancel_new_user_button").click();
            
            addNewUserToUI(result[0]._id, result[0].name, result[0].email, result[0].donation);
        }
    });
}

function getTodaysDate(){
    var dateNow = new Date(),
    todaysMonth = dateNow.getMonth()+1,
    todaysDay   = dateNow.getDate(),
    todaysYear  = dateNow.getFullYear();

    if(todaysMonth < 10) todaysMonth = "0"+todaysMonth;
    if(todaysDay < 10) todaysDay = "0"+todaysDay;

    return todaysYear + "/" + todaysMonth + "/" + todaysDay;
}

function addNewUserToUI(dbID, name, email, donations){
    console.dir(donations);
    var data = {};
    var usersJSON = [{  "name":name,                    
                        "email":email,
                        "donation":donations,
                        "_id":dbID
                    }];
    data.usersJSON = usersJSON;
    $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '/admin/users/getUserItemHTML',                                                
        success: function(data) {
            // console.log('success');   
             console.log(data);
            var userItemHtml = data;   

            if($("#"+dbID)) $("#"+dbID).remove();
            $("#users_list").prepend(userItemHtml); 
            
        }
    });

}

function updateUser(dbID, name, email, donations){

    //console.dir(donations);
    var data = {};
    data.dbID = dbID;
    data.name = name;
    data.email = email;
    data.donation = donations;
    
    $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '/admin/users/updateUser',                                                
        success: function(data) {
            // console.log('success');
            // console.log(JSON.stringify(data));

            $("#cancel_new_user_button").click();
        }
    });

    $("#"+dbID+" td")[1].innerHTML = name;
    $("#"+dbID+" td")[2].innerHTML = email;
    $("#"+dbID+" td")[4].innerHTML = getDonationsHTML(donations);

}

function getDonationsHTML(donations){
    var donationsHtml = "";

    for(var i=0; i < donations.length; i++){
        donationsHtml = donationsHtml +
        "<div class='well well-sm' style='margin-bottom: 4px;'><span class='amount label label-success'> $" + donations[i].amount + "</span>&nbsp;"+
        "<span class='date'>" + donations[i].date + "</span>&nbsp;<span class='source'>" + donations[i].source + "</span></div>"
    }

    return donationsHtml;
}

var updatingUserID = "";
var updatingUser = false;
function editUser(dbID, key){  
    var name = $("#"+dbID+" td")[1].innerHTML;
    var email = $("#"+dbID+" td")[2].innerHTML;

    clearAddUserModal();

    $("#add_user_name").val(name);
    $("#add_user_email").val(email);
    $("#user_pic img").attr("src", "http://www.gravatar.com/avatar/"+ keyGen.getMd5( email.toLowerCase() ) + "?d=http://api.chromemote.com/images/user_placeholder.png" );
    $("#edit_modal_key_view").val(key);
    $("#gravatarJson").remove();
    $("head").append("<script src='http://en.gravatar.com/"+ keyGen.getMd5( email.toLowerCase() ) +".json?callback=gravatarUpdate' id='gravatarJson' type='text/javascript'></script>");
    $("#donation_amount_input").val("");
    $("#donation_source_input").val("paypal");
    $("#donation_date_input").val("");

    $("#edit_user_donation_list").text("");

    var donationEls = $("#"+dbID+" td")[4];
    for(var i=0; i < donationEls.getElementsByClassName("amount").length; i++){
        addDonation(donationEls.getElementsByClassName("amount")[i].innerHTML.replace('$',''), donationEls.getElementsByClassName("source")[i].innerHTML, donationEls.getElementsByClassName("date")[i].innerHTML);
    }

    updatingUserID = dbID;
    updatingUser = true;

    //window.scrollTo(0,0);
    $('#addEditUserModal').modal('show');
    
}
function removeUser(dbID){
    var thisUserName = $("#"+dbID+" .name").html();

    $('#areYouSureModal').modal('show');
    $("#are_you_sure_message .name").html( thisUserName );

    $("#userIDtoDeleteHolder").val(dbID);
}
 //  Manage Users  ///////////END//
//////////////////////////////////





  /////////////////////////////////
 //  Dashboard Methods  ///START//
function initDashStats(){
    if(document.getElementById("pieCanvas")){
        var payPalTotal = 0,
            amazonTotal = 0,
            googleTotal = 0,
            stripeTotal = 0,
            donationTotal=0,
            proUserTotal= 0,
            amountTotal = 0,
            weeklyTotal = 0;

        var data = {};        
        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: '/admin/dashboard/get_stats',                                                
            success: function(data) {
                console.log('success');
                console.log(JSON.stringify(data));
                var countSpeed    = 600,
                    countInterval = 50;
                
                $('#dash_counter_total_paid_users').countTo({ from: 0, to: data.proUserTotal, speed: countSpeed, refreshInterval: countInterval, onComplete: function(value) {} });
                
                $('#dash_counter_total_amount').countTo({ from: 0, to: data.amountTotal, speed: countSpeed, refreshInterval: countInterval, onComplete: function(value) {} });
                
                $('#dash_counter_total_donations').countTo({ from: 0, to: data.donationTotal, speed: countSpeed, refreshInterval: countInterval, onComplete: function(value) {} });
                initPieGraph(data.amazonTotal,data.googleTotal,data.payPalTotal,data.stripeTotal);

                $('#dash_counter_average_donation').countToDec({ from: 0, to: data.donationAvg, speed: countSpeed, refreshInterval: countInterval, onComplete: function(value) {} });

                $('#dash_counter_weekly_users').countTo({ from: 0, to: data.weeklyUsers[data.weeklyUsers.length-1].users, speed: countSpeed, refreshInterval: countInterval, onComplete: function(value) {} });
                initUsersGraph(data.weeklyUsers);

                $('#dash_counter_comments').countTo({ from: 0, to: data.weeklyUsers[data.weeklyUsers.length-1].comments, speed: countSpeed, refreshInterval: countInterval, onComplete: function(value) {} });
            }
        });
    }
}
//Stuff for loading stats on dashboard.
function initPieGraph(amazonVal, googleVal, paypalVal, stripeVal){
    var pieData = [        
        {
            value : amazonVal,
            color : "#fc9a18"     //Amazon
        },
        {
            value : googleVal,
            color : "#48ad33"   //GoogleWallet
        },
        {
            value : stripeVal,
            color : "#000000"   //Paypal
        },
        {
            value : paypalVal,
            color : "#326799"   //Paypal
        }
        

    ];
       
    $("#pieCanvas").attr("title","PayPal \t" + paypalVal + "   \nGoogle \t" + googleVal + "   \nAmazon \t" + amazonVal)

    var options = {
        //Boolean - Whether we should show a stroke on each segment
        segmentShowStroke : true,
        
        //String - The colour of each segment stroke
        segmentStrokeColor : "#f8f8f8",
        
        //Number - The width of each segment stroke
        segmentStrokeWidth : 2,
        
        //Boolean - Whether we should animate the chart 
        animation : true,
        
        //Number - Amount of animation steps
        animationSteps : 75,
        
        //String - Animation easing effect
        animationEasing : "easeOutBounce",
        
        //Boolean - Whether we animate the rotation of the Pie
        animateRotate : true,

        //Boolean - Whether we animate scaling the Pie from the centre
        animateScale : false,
        
        //Function - Will fire on animation completion.
        onAnimationComplete : null
    }

    var myPie = new Chart(document.getElementById("pieCanvas").getContext("2d")).Doughnut(pieData, options); 
}

//Stuff for loading stats on dashboard.
var cwsData, cwsLabels, startIndex = 0, maxDisplayed = 30;
function initUsersGraph(weeklyUsersStats){
    
    cwsData = [], cwsLabels = [];

    if(weeklyUsersStats.length > maxDisplayed) startIndex = weeklyUsersStats.length-maxDisplayed;
    for(var i=startIndex; i<weeklyUsersStats.length; i++){
        cwsData.push(parseInt(weeklyUsersStats[i].users));
        cwsLabels.push(weeklyUsersStats[i].date.substring(0,5));
    }
    
    //Always show label for first and last but never second and one before last.
    //Blank out all others except for every fourth label.
    for(var i=1; i<cwsLabels.length-1; i++){
        if(!(i%4==0)) cwsLabels[i] = "";
    }
    cwsLabels[1] = "";
    cwsLabels[cwsLabels.length-2] = "";

    console.log(cwsData);
    var graphData = {
        labels : cwsLabels,
        datasets : [
            {
                fillColor : "rgba(151,187,205,0.5)",
                strokeColor : "rgba(151,187,205,1)",
                pointColor : "rgba(151,187,205,1)",
                pointStrokeColor : "#fff",
                data : cwsData
            }
        ]
    }
    
    var options = {}
    var usersGraph = new Chart(document.getElementById("weeklyUserCanvas").getContext("2d")).Line(graphData, options);
}

(function($) {
    $.fn.countTo = function(options) {
        // merge the default plugin settings with the custom options
        options = $.extend({}, $.fn.countTo.defaults, options || {});

        // how many times to update the value, and how much to increment the value on each update
        var loops = Math.ceil(options.speed / options.refreshInterval),
            increment = (options.to - options.from) / loops;

        return $(this).each(function() {
            var _this = this,
                loopCount = 0,
                value = options.from,
                interval = setInterval(updateTimer, options.refreshInterval);

            function updateTimer() {
                value += increment;
                loopCount++;
                $(_this).html(value.toFixed(options.decimals));

                if (typeof(options.onUpdate) == 'function') {
                    options.onUpdate.call(_this, value);
                }

                if (loopCount >= loops) {
                    clearInterval(interval);
                    value = options.to;

                    if (typeof(options.onComplete) == 'function') {
                        options.onComplete.call(_this, value);
                    }
                }
            }
        });
    };

    $.fn.countTo.defaults = {
        from: 0,  // the number the element should start at
        to: 100,  // the number the element should end at
        speed: 1000,  // how long it should take to count between the target numbers
        refreshInterval: 100,  // how often the element should be updated
        decimals: 0,  // the number of decimal places to show
        onUpdate: null,  // callback method for every time the element is updated,
        onComplete: null,  // callback method for when the element finishes updating
    };
})(jQuery);

(function($) {
    $.fn.countToDec = function(options) {
        // merge the default plugin settings with the custom options
        options = $.extend({}, $.fn.countToDec.defaults, options || {});

        // how many times to update the value, and how much to increment the value on each update
        var loops = Math.ceil(options.speed / options.refreshInterval),
            increment = (options.to - options.from) / loops;

        return $(this).each(function() {
            var _this = this,
                loopCount = 0,
                value = options.from,
                interval = setInterval(updateTimer, options.refreshInterval);

            function updateTimer() {
                value += increment;
                loopCount++;
                $(_this).html(value.toFixed(options.decimals));

                if (typeof(options.onUpdate) == 'function') {
                    options.onUpdate.call(_this, value);
                }

                if (loopCount >= loops) {
                    clearInterval(interval);
                    value = options.to;

                    if (typeof(options.onComplete) == 'function') {
                        options.onComplete.call(_this, value);
                    }
                }
            }
        });
    };

    $.fn.countToDec.defaults = {
        from: 0,  // the number the element should start at
        to: 100,  // the number the element should end at
        speed: 1000,  // how long it should take to count between the target numbers
        refreshInterval: 100,  // how often the element should be updated
        decimals: 2,  // the number of decimal places to show
        onUpdate: null,  // callback method for every time the element is updated,
        onComplete: null,  // callback method for when the element finishes updating
    };
})(jQuery);
 //  Dashboard Methods  //////END//
//////////////////////////////////





 /////////////////////////////////
//  New Post Methods  ////START//
function initBlogNewBlogPost(){

    if(document.getElementById("blog_post_edit_bar")){

        var postDateInput = $('#post_date_input').datepicker().on('changeDate', function(ev) {      
            var formattedDate = getFormattedDate(ev.date);
            $(".blog_item .date").attr("title", formattedDate);
            $(".blog_item .month").html(getMonth(formattedDate));
            $(".blog_item .day").html(getDay(formattedDate));
        });

        var editorOpen = false, isEditorMax = false, isEditorSide = false, isEditorHoriMax = false, isEditorVertMax = false, lastTop = "50px", lastSize = {};
        $('#toggleEditorButton').click(function(){
            if(!editorOpen){
                editorOpen = true;
                $('#blog_post_editor').css("top", lastTop);

                if( parseInt($('#blog_post_editor').css("left").replace("px","")) + $('#blog_post_editor').width() > $(window).width() ){
                    $('#blog_post_editor').css("left", $(window).width() - $('#blog_post_editor').width() );
                }
                if( parseInt($('#blog_post_editor').css("left").replace("px","")) < 0 ){
                    $('#blog_post_editor').css("left", 0 );
                }

                if( parseInt($('#blog_post_editor').css("top").replace("px","")) + $('#blog_post_editor').height() > $(window).height() ){
                    $('#blog_post_editor').css("top", $(window).height() - $('#blog_post_editor').height() );
                }
                if( parseInt($('#blog_post_editor').css("top").replace("px","")) < 0 ){
                    $('#blog_post_editor').css("top", 0 );
                }
            } else{
                editorOpen = false;
                lastTop = $('#blog_post_editor').css("top");
                $('#blog_post_editor').css("top", "-1000px");
            }
        });
        $('#blog_post_editor_close_btn').click(function(){
            $('#toggleEditorButton').click();
        });

        $('#blog_post_editor_max_btn').click(function(){
            if(!isEditorMax){
                if(!isEditorSide && !isEditorHoriMax && !isEditorVertMax)
                    lastSize = { top:   $('#blog_post_editor').css("top"),
                                 left:  $('#blog_post_editor').css("left"),
                                 width:  $('#blog_post_editor').css("width"),
                                 height: $('#blog_post_editor').css("height") };

                $('#blog_post_editor').css("top","50px");
                $('#blog_post_editor').css("left","0px");
                $('#blog_post_editor').css("width","100%");
                $('#blog_post_editor').css("height","calc(100% - 50px)");
                isEditorMax = true;
            } else {
                $('#blog_post_editor').css("top", lastSize.top);
                $('#blog_post_editor').css("left", lastSize.left);
                $('#blog_post_editor').css("width", lastSize.width);
                $('#blog_post_editor').css("height", lastSize.height);
                isEditorMax = false;
            }
            isEditorSide = false; isEditorHoriMax = false; isEditorVertMax = false; 
        });

        $('#blog_post_editor_side_btn').click(function(){
            if(!isEditorSide){
                if(!isEditorMax && !isEditorHoriMax && !isEditorVertMax)
                    lastSize = { top:   $('#blog_post_editor').css("top"),
                                 left:  $('#blog_post_editor').css("left"),
                                 width:  $('#blog_post_editor').css("width"),
                                 height: $('#blog_post_editor').css("height") };

                $('#blog_post_editor').css("top","50px");
                $('#blog_post_editor').css("left","0px");
                $('#blog_post_editor').css("width","450px");
                $('#blog_post_editor').css("height","calc(100% - 50px)");
                isEditorSide = true;
            } else {
                $('#blog_post_editor').css("top", lastSize.top);
                $('#blog_post_editor').css("left", lastSize.left);
                $('#blog_post_editor').css("width", lastSize.width);
                $('#blog_post_editor').css("height", lastSize.height);
                isEditorSide = false;
            }
            isEditorMax = false; isEditorHoriMax = false; isEditorVertMax = false;
        });

        $('.blog_item .body').keyup( function(){
            //$('#blog_post_editor textarea').val( $('.blog_item .body').html() );
            if(editor!=null)editor.setValue( $('.blog_item .body').html() );
        });

        
        $(document).keydown(function(e) {
            if ((e.which == '115' || e.which == '83' ) && (e.ctrlKey || e.metaKey))
            {
                e.preventDefault();
                //alert("Ctrl-s pressed");
                if(editor!=null) $('.blog_item .body').html( editor.getValue() );
                clearTimeout(updateBodyTimeout);
                return false;
            }
            return true;
        }); 

        $(document).keydown(function(e) {
            if ((e.which == '115' || e.which == '85' ) && (e.ctrlKey || e.metaKey))
            {
                e.preventDefault();
                // alert("Ctrl-u pressed");
                if(editor!=null) $('.blog_item .body').html( editor.getValue() );
                clearTimeout(updateBodyTimeout);
                return false;
            }
            return true;
        }); 

        var updateBodyTimeout = null;
        $('#blog_post_editor textarea').keydown( function(){
            //$('.blog_item .body').html( $('#blog_post_editor textarea').val() );

            clearTimeout(updateBodyTimeout);            
            updateBodyTimeout = setTimeout(function(){
                if(editor!=null) $('.blog_item .body').html( editor.getValue() );
            },5000);
            
        });

        $('#blog_post_editor_grabber').dblclick(function(e){
        
            if(e.offsetY <= 25 && e.offsetX >= 35){
                $('#blog_post_editor_max_btn').click(); 

            } else if(e.offsetY <= 25 && e.offsetX < 35){
                $('#blog_post_editor_close_btn').click();   

            } else if(e.offsetY > 25 && e.offsetY <= $('#blog_post_editor_grabber').height() - 10){
                //console.log("horizontal max");
                if(!isEditorHoriMax){
                    if(!isEditorMax && !isEditorSide && !isEditorVertMax)
                        lastSize = { top:   $('#blog_post_editor').css("top"),
                                     left:  $('#blog_post_editor').css("left"),
                                     width:  $('#blog_post_editor').css("width"),
                                     height: $('#blog_post_editor').css("height") };

                    $('#blog_post_editor').css("left","0px");
                    $('#blog_post_editor').css("width","100%");
                    isEditorHoriMax = true;
                } else {
                    $('#blog_post_editor').css("top", lastSize.top);
                    $('#blog_post_editor').css("left", lastSize.left);
                    $('#blog_post_editor').css("width", lastSize.width);
                    $('#blog_post_editor').css("height", lastSize.height);
                    isEditorHoriMax = false;
                }
                isEditorSide = false; isEditorMax = false;
            } else if(e.offsetY > $('#blog_post_editor_grabber').height() - 10){
                //console.log("vertical max");
                if(!isEditorVertMax){
                    if(!isEditorMax && !isEditorSide && !isEditorHoriMax)
                        lastSize = { top:   $('#blog_post_editor').css("top"),
                                     left:  $('#blog_post_editor').css("left"),
                                     width:  $('#blog_post_editor').css("width"),
                                     height: $('#blog_post_editor').css("height") };

                    $('#blog_post_editor').css("top","50px");
                    $('#blog_post_editor').css("height","calc(100% - 50px)");
                    isEditorVertMax = true;
                } else {
                    $('#blog_post_editor').css("top", lastSize.top);
                    $('#blog_post_editor').css("left", lastSize.left);
                    $('#blog_post_editor').css("width", lastSize.width);
                    $('#blog_post_editor').css("height", lastSize.height);
                    isEditorVertMax = false;
                }
                isEditorSide = false; isEditorMax = false;
            }

        });

        $('#blog_post_editor').draggable({ 
            handle:"#blog_post_editor_grabber",
            snapMode: "inner"
        });
        $('#blog_post_editor').on('drag', function(){  });

        $('#blog_post_editor').resizable();
        $('#blog_post_editor').on('resize', function(){
            if( $('#blog_post_editor').css("height") > $(window).height()-50 )
                $('#blog_post_editor').css("height", $(window).height()-50 );
            isEditorMax = false; isEditorSide = false;
        });

        $('#saveNewPostButton').click(function(){
            console.log("save");
            if(editor!=null) $('.blog_item .body').html( editor.getValue() );
            clearTimeout(updateBodyTimeout);
            
            var data = {};
            data.title = $(".blog_item .title").text();
            data.date  = $("#post_date_input").val() + " " + $("#post_time_input").val();
            data.body  = $(".blog_item .body").html();
            data.id    = $("#post_id").val();
            data.path  = $(".blog_item .title").text().toLowerCase().replaceAll(" ","-");
            if($("#pub_status").val() == "false") data.live = false;
            else data.live = true;

            $('#saveNewPostButton').html("<div id='saving_spinner'></div>");
            var saveTimeout = setTimeout(function(){
                $('#saveNewPostButton').html("Save");
            },10000);

            //console.dir(data);
            if($("#post_id").val()==""){
                $.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: '/admin/blog/new',
                    success: function(data) {
                        console.log('success');
                        window.open('/admin/blog/id/'+data[0]._id, '_self');
                        $('#saveNewPostButton').html("Save");
                        clearTimeout(saveTimeout);
                    }
                });
            } else {
                //Update existing..
                 $.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: '/admin/blog/update',
                    success: function(data) {
                        console.dir(data);
                        //window.open('/admin/blog/id/'+data[0]._id, '_self');
                        $('#saveNewPostButton').html("Save");
                        clearTimeout(saveTimeout);
                    }
                });
            }
            

        });

        $('#postNewPostButton').click(function(){
            console.log("post"); 
            if(editor!=null) $('.blog_item .body').html( editor.getValue() );
            clearTimeout(updateBodyTimeout);

            var data = {};
            data.title = $(".blog_item .title").text();
            data.date  = $("#post_date_input").val() + " " + $("#post_time_input").val();
            data.body  = $(".blog_item .body").html();
            data.id    = $("#post_id").val();
            data.path  = $(".blog_item .title").text().toLowerCase().replaceAll(" ","-");
            if($("#pub_status").val() == "false") data.live = true;
            else data.live = false;

            //console.dir(data);
            if($("#post_id").val()==""){
                data.live = true;
                $.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: '/admin/blog/new',
                    success: function(data) {
                        console.log('success');
                        window.open('/admin/blog/id/'+data[0]._id, '_self');
                    }
                });

            } else {               console.log("update");  
                //Update & publish existing..
                $.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: '/admin/blog/update',
                    success: function(data) {
                        console.log('success');  
                        console.dir(data);
                        if($("#pub_status").val() == "false"){
                            $("#postNewPostButton").attr("class", "btn btn-default btn-danger");
                            $("#postNewPostButton").html("Unpost");
                            $("#pub_status").val("true");
                        } else {
                            $("#postNewPostButton").attr("class", "btn btn-default btn-success");
                            $("#postNewPostButton").html("Post");
                            $("#pub_status").val("false");
                        }
                        //window.open('/admin/blog/id/'+data[0]._id, '_self');
                    }
                });
            }
            

        });


    }
}
  // New Post Methods  //////END///
 /////////////////////////////////





  /////////////////////////////////
 //  Manage Ads Methods  //START//
function initManageAds(){
    $("#add_new_ad_button").click(function(){
        var validInput = true;
        if( $("#manual_ad_image_url_input").val() == "" ) {
            validInput = false;
            flashErrorBorder("manual_ad_image_url_input");
            return;
        }
        if( $("#manual_ad_link_url_input").val() == "" ) {
            validInput = false;
            flashErrorBorder("manual_ad_link_url_input");
        } 
        if(validInput) {
            addNewAd($(".admin_ad").length + 1, $("#manual_ad_image_url_input").val(), $("#manual_ad_link_url_input").val());
        }
    });
}

function addNewAd(order, imageUrl, linkUrl){
    console.log(imageUrl + " " + linkUrl);
    var data = {};
    data.order = order;
    data.imageUrl = imageUrl;
    data.linkUrl  = linkUrl;
    //console.dir(data);
    $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '/admin/ads/new',                                                
        success: function(data) {
            // console.log('success');
            addNewAdToUI(data[0]._id, data[0].order, data[0].img, data[0].url);
        }
    });

}

function moveAdUp(adId){
    var thisElement = $("#"+adId).clone();    
    if( $("#"+adId).prev()[0] ) {
        var prevElementId = $("#"+adId).prev()[0].id;
        $("#"+adId).remove();
        thisElement.insertBefore("#"+prevElementId);
        updateOrder();
    }
}

function moveAdDown(adId){
    var thisElement = $("#"+adId).clone();    
    if( $("#"+adId).next()[0] ) {
        var nextElementId = $("#"+adId).next()[0].id;
        $("#"+adId).remove();
        thisElement.insertAfter("#"+nextElementId);
        updateOrder();
    }
}

function addNewAdToUI(dbID, order, imageUrl, linkUrl){
    var data = {};
    var adsJSON = [{"order":order,
                    "_id":dbID,
                    "img":imageUrl,
                    "url":linkUrl,
                    "enabled_status": 0}];
    data.adsJSON = adsJSON;
    //console.dir(data);
    $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '/admin/ads/getAdItemHTML',                                                
        success: function(data) {
            // console.log('success');   
            // console.log(data);
            var adItemHtml = data;   
            $("#admin_ads_list").append(adItemHtml); 
            $("#manual_ad_image_url_input").val("");
            $("#manual_ad_link_url_input").val("");
            $("#add_new_ad_button").blur();     
        }
    });
}

function removeAd(dbID){  
    var data = {};
    data.dbID = dbID;
    $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '/admin/ads/remove',                                                
        success: function(data) {
            // console.log('success');
            // console.log(JSON.stringify(data));
            $("#"+dbID).remove();
            updateOrder();
        }
    });
}

function updateOrder(){
    var orderElements = document.getElementsByClassName("admin_ad_order");
    for(var i=0;i < orderElements.length; i++){        
        var newOrder = i+1;
        var adId = orderElements[i].parentNode.id;

        orderElements[i].innerHTML = newOrder;

        var data = {};
        data.dbID = adId;
        data.order = newOrder;
        
        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: '/admin/ads/updateOrder',                                                
            success: function(data) {
                //console.log('success');
                //console.log(JSON.stringify(data));
            }
        });
    }
}

function flashErrorBorder(elId){
    $("#"+elId).css("border-color", "#f00");
    setTimeout(function () {
        $("#"+elId).css("border-color", "");
        setTimeout(function () {
            $("#"+elId).css("border-color", "#f00");
            setTimeout(function () {
                $("#"+elId).css("border-color", "");
                setTimeout(function () {
                    $("#"+elId).val('');
                    $("#"+elId).focus();
                    $("#"+elId).select();
                }, 150);
            }, 150);
        }, 150);
    }, 150);
}

var enableAd = function(dbID){
    console.log("Approved: "+ dbID);

    document.getElementById("enabledBtn_" + dbID).className = 'btn btn-success btn-xs active';
    document.getElementById("enabledBtn_" + dbID).innerHTML = '<i class="glyphicon glyphicon-ok"></i>';

    document.getElementById("disabledBtn_" + dbID).className = 'btn btn-default btn-xs';
    document.getElementById("disabledBtn_" + dbID).innerHTML = '<i class="glyphicon glyphicon-remove"></i>';

    var data = {};
    data.dbID = dbID;
    data.status = 1;
    
    $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '/admin/ads/enabler',                                                
        success: function(data) {
            // console.log('success');
            // console.log(JSON.stringify(data));
        }
    });

}

var disableAd = function(dbID){
    console.log("Disapproved: "+ dbID);

    document.getElementById("enabledBtn_" + dbID).className = 'btn btn-default btn-xs';
    document.getElementById("enabledBtn_" + dbID).innerHTML = '<i class="glyphicon glyphicon-ok"></i>';
    
    document.getElementById("disabledBtn_" + dbID).className = 'btn btn-danger btn-xs active';
    document.getElementById("disabledBtn_" + dbID).innerHTML = '<i class="glyphicon glyphicon-remove"></i>';
    
    var data = {};
    data.dbID = dbID;
    data.status = 2;
    
    $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '/admin/ads/enabler',                                                
        success: function(data) {
            // console.log('success');
            // console.log(JSON.stringify(data));
        }
    });
}
 // Manage Ads Methods  ////END///
/////////////////////////////////





 /////////////////////////////////
// Manage Posts Methods //START//
function removePost(postId){
    console.log(postId);

    var data = {};
    data.dbID = postId;

    $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '/admin/blog/remove',                                                
        success: function(data) {
            console.log('success');
            $("#"+postId).remove();
        }
    });
}

function publishPost(dbID){
    console.log("Published: "+ dbID);

    document.getElementById("publishBtn_" + dbID).className = 'btn btn-success btn-xs active';
    document.getElementById("publishBtn_" + dbID).innerHTML = '<i class="glyphicon glyphicon-play"></i>';

    document.getElementById("unpublishBtn_" + dbID).className = 'btn btn-default btn-xs';
    document.getElementById("unpublishBtn_" + dbID).innerHTML = '<i class="glyphicon glyphicon-pause"></i>';

    var data = {};
    data.dbID = dbID;
    data.live = true;
    
    $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '/admin/blog/publish',                                                
        success: function(data) {
            // console.log('success');
            // console.log(JSON.stringify(data));
        }
    });

}

function unpublishPost(dbID){
    console.log("Unpublished: "+ dbID);

    document.getElementById("publishBtn_" + dbID).className = 'btn btn-default btn-xs';
    document.getElementById("publishBtn_" + dbID).innerHTML = '<i class="glyphicon glyphicon-play"></i>';
    
    document.getElementById("unpublishBtn_" + dbID).className = 'btn btn-info btn-xs active';
    document.getElementById("unpublishBtn_" + dbID).innerHTML = '<i class="glyphicon glyphicon-pause"></i>';
    
    var data = {};
    data.dbID = dbID;
    data.live = false;
    
    $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: '/admin/blog/publish',                                                
        success: function(data) {
            // console.log('success');
            // console.log(JSON.stringify(data));
        }
    });
}
 // Manage Posts Methods ///END///
/////////////////////////////////






function updateCWSStats(){
    if(document.getElementById("pieCanvas")){
        
        var data = {};        
        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: '/admin/dashboard/pull_cws',                                                
            success: function(data) {
                console.log('success');
                console.log(JSON.stringify(data));
                                
            }
        });



    }
}