const express = require('express');
const app = express();
const PORT = 4040
const mysql = require('mysql');
const otpGenerator = require('otp-generator')
var tambola = require('./tam');
var config = require("./config.json");
// var ticket = tambola.generateTicket(100);
// var seq = tambola.getDrawSequence();


const con = mysql.createConnection({
    host: config.db.live.host,
    user: config.db.live.user,
    password: config.db.live.password,
    database: config.db.live.database
});

const admin = require('firebase-admin');
var serviceAccount;
serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: config.pushNotification.databaseURL
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});


function sendPushNotification(deviceToken,dataPush) {

    /*"data": {
      "title": data.title,
      "body": data.body,
      "notification_type": '100',
      "room":data.room.toString(),
      "sound" 		:  "default",
      "content_available":  "true",
      "priority": "high"
      
     
    },*/

    dataPush["sound"]               = "default";
    dataPush["content_available"]   = "true";
    dataPush["priority"]            = "priority";


    console.log("Dada Push Body "+dataPush.body);

    var body = dataPush.body;
   
    if(body.length > 100){

      body = body.substring(0,100);
    }
    dataPush["body"]            = body



    var message = {
      
      "notification":{
        "title":dataPush.title,
        "body":body
        
      },
      "data":dataPush,
      token: deviceToken
    };
    console.log(message);

    // Send a message to the device corresponding to the provided
    // registration token.
    admin.messaging().send(message)
      .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
    
    

  }

async function isOtp(x) {
    return await otpGenerator.generate(x, { lowerCaseAlphabets: false,upperCaseAlphabets: false, specialChars: false });
};

async function isGame(x) {
    return await otpGenerator.generate(x, { lowerCaseAlphabets: true,upperCaseAlphabets: true, specialChars: false });
};

async function isRef(x) {
    return await otpGenerator.generate(x, { lowerCaseAlphabets: false,upperCaseAlphabets: true, specialChars: false });
};

async function arrayEquals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

async function removeItemAll(arr, value) {
  var i = 0;
  while (i < arr.length) {
    if (arr[i] === value) {
      arr.splice(i, 1);
    } else {
      ++i;
    }
  }
  return arr;
}
////// user system
//
////////////// follower and follow
GetFollower = (id) => {
    return new Promise((resolve, reject) => {
        con.query('select follower.user_id,follower.follower_id,  user.username,  user.image from follower INNER JOIN user ON follower.follower_id = user.id WHERE follower.user_id=?',[id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

GetWinnerList = (id) => {
    return new Promise((resolve, reject) => {
        con.query('select tbl_game_winner.creater_id, tbl_game_winner.winner_id, tbl_game_winner.ticket_id, tbl_game_winner.winner_type, tbl_game_winner.winning_amount,   user.username,  user.image from tbl_game_winner INNER JOIN user ON tbl_game_winner.winner_id = user.id WHERE tbl_game_winner.game_id=?',[id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};


GetAllWinnerList = () => {
    return new Promise((resolve, reject) => {
        con.query('select tbl_game_winner.creater_id, tbl_game_winner.game_id, tbl_game_winner.winner_id, tbl_game_winner.ticket_id, tbl_game_winner.winner_type, tbl_game_winner.winning_amount,   user.username,  user.image from tbl_game_winner INNER JOIN user ON tbl_game_winner.winner_id = user.id', (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

GetTopWinnerList = () => {
    return new Promise((resolve, reject) => {
        con.query('select tbl_game_winner.creater_id, tbl_game_winner.winner_id,tbl_game_winner.game_id,tbl_game_winner.ticket_id, tbl_game_winner.winner_type, tbl_game_winner.winning_amount,   user.username,  user.image from tbl_game_winner INNER JOIN user ON tbl_game_winner.winner_id = user.id ORDER by tbl_game_winner.id DESC',[], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

////following
GetFollowing = (id) => {
    return new Promise((resolve, reject) => {
        con.query('select follower.user_id,follower.follower_id,  user.username,  user.image from follower INNER JOIN user ON follower.user_id = user.id WHERE follower.follower_id=?',[id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};
//
//
//
//
//
//
//
//game Category
myInvitationList = (id, status) => {
    return new Promise((resolve, reject) => {
        con.query('select tbl_game_invitation.id,tbl_game_invitation.sender,tbl_game_invitation.game_id, tbl_game_invitation.i_time,  user.username,  user.image from tbl_game_invitation INNER JOIN user ON tbl_game_invitation.sender = user.id WHERE tbl_game_invitation.receiver=? and tbl_game_invitation.status=?',[id, status], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

SendInvitationToAll = (sender, reciever, game_id) => {
    return new Promise((resolve, reject) => {
        con.query('INSERT INTO tbl_game_invitation (`sender`, `receiver`, `game_id`, `i_time`) VALUES (?,?,?,?)',
            [sender, reciever, game_id, Date.now()], (error, result) => {
                if (error) return reject(error);
                return resolve(result.insertId);
            });
    });
};

UpdateGameInv = (uid, inv, status) => {
    return new Promise((resolve, reject) => {
        con.query('UPDATE tbl_game_invitation SET `status`=? WHERE id=? and receiver',[status, inv, uid], (error, elements)=>{
        	if(error) return reject(error);
        	return resolve(elements)
        	});
    });
};


findGameCat = () => {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM tbl_game_category', (error, elements) => {
            if (error) {
                return reject(error);
            }
            return resolve(elements);
        });
    });
};

findGameCatID = (id, status) => {
    return new Promise((resolve, reject) => {
        con.query('select tbl_game.game_id,tbl_game.creater_id, tbl_game.game_name, tbl_game.game_amount, tbl_game.game_time, tbl_game.game_date, user.username,  user.image from tbl_game INNER JOIN user ON tbl_game.creater_id = user.id WHERE tbl_game.cat_id=? && tbl_game.status=?',[id,status], (error, elements) => {
            if (error) {
                return reject(error);
            }
            return resolve(elements);
        });
    });
};

findAllGame = (status) => {
    return new Promise((resolve, reject) => {
        con.query('select tbl_game.game_id,tbl_game.creater_id, tbl_game.game_name, tbl_game.game_amount, tbl_game.game_time, tbl_game.game_date, tbl_game.cat_id, user.username,  user.image from tbl_game INNER JOIN user ON tbl_game.creater_id = user.id WHERE tbl_game.status=?',[status], (error, elements) => {
            if (error) {
                return reject(error);
            }
            return resolve(elements);
        });
    });
};


findGameCatIdUid = (uid,cat_id,status) => {
    return new Promise((resolve, reject) => {
        con.query('select tbl_game.game_id,tbl_game.creater_id, tbl_game.game_name, tbl_game.game_amount, tbl_game.game_time, tbl_game.game_date, tbl_game.cat_id, user.username,  user.image from tbl_game INNER JOIN user ON tbl_game.creater_id = user.id WHERE  user.id=? &&  tbl_game.cat_id=? && tbl_game.status=?',[uid,cat_id,status], (error, elements) => {
            if (error) {
                return reject(error);
            }
            return resolve(elements);
        });
    });
};
//////check user
checkUser = (id) => {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM phone_number_verify WHERE phone=? and sponcer !=""',[id], (error, elements) => {
            if (error) {
                return reject(error);
            }
            return resolve(elements);
        });
    });
};
checkNewUser = (id) => {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM phone_number_verify WHERE phone=?',[id], (error, elements) => {
            if (error) {
                return reject(error);
            }
            return resolve(elements);
        });
    });
};
checkPhoneOtp = (id,otp) => {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM phone_number_verify WHERE phone=? && otp=?',[id,otp], (error, elements) => {
            if (error) {
                return reject(error);
            }
            return resolve(elements);
        });
    });
};

/// insert user into phone number check
insertUser = (phone, otp, ref) => {
    return new Promise((resolve, reject) => {
        con.query('INSERT INTO phone_number_verify (`phone`, `otp`,`sponcer`) VALUES (?, ?,?)',
            [phone, otp, ref], (error, result) => {
                if (error) return reject(error);
                return resolve(result.insertId);
            });
    });
};
/////new follower
newFollower = (spo, user) => {
    return new Promise((resolve, reject) => {
        con.query('INSERT INTO follower (`user_id`, `follower_id`, `created_at`) VALUES (?, ?,?)',
            [spo, user, Date.now()], (error, result) => {
                if (error) return reject(error);
                return resolve(result.insertId);
            });
    });
};



///////update user otp
UpdateUserOTP = (phone, otp) => {
    return new Promise((resolve, reject) => {
        con.query('UPDATE phone_number_verify SET `otp`=? WHERE phone=?',[otp, phone], (error, elements)=>{
        	if(error) return reject(error);
        	return resolve(elements)
        	});
    });
};

UpdateUserOTPRef = (phone, otp, ref) => {
    return new Promise((resolve, reject) => {
        con.query('UPDATE phone_number_verify SET `otp`=?, sponcer=? WHERE phone=?',[otp, ref, phone], (error, elements)=>{
        	if(error) return reject(error);
        	return resolve(elements)
        	});
    });
};
updateBySponcerID = (ref, wallet) => {
    return new Promise((resolve, reject) => {
        con.query('UPDATE user SET `available_coin`=? WHERE referral_id=?',[wallet, ref], (error, elements)=>{
        	if(error) return reject(error);
        	return resolve(elements)
        	});
    });
};




///////////
UpdateUserCoinByPhone = (phone, coin) => {
    return new Promise((resolve, reject) => {
        con.query('UPDATE user SET `available_coin`=? WHERE phone=?',[coin, phone], (error, elements)=>{
        	if(error) return reject(error);
        	return resolve(elements)
        	});
    });
};
//////// comission   //////
comissionList = () => {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM tbl_comission', (error, elements) => {
            if (error) {
                return reject(error);
            }
            return resolve(elements);
        });
    });
};
////// % of numbers of player in each level
EachLevelWinner = () => {
    return new Promise((resolve, reject) => {
        con.query('SELECT player_each_level FROM tbl_comission', (error, elements) => {
            if (error) {
                return reject(error);
            }
            return resolve(elements);
        });
    });
};

levelEarnByID = (id) => {
    return new Promise((resolve, reject) => {
        con.query('select * from tbl_transection WHERE user_id=? && amount_type=?',[id,2], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

gameTableEarnByID = (id) => {
    return new Promise((resolve, reject) => {
        con.query('select * from tbl_transection WHERE user_id=? && amount_type=?',[id,1], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};


gameWinnerEarnByID = (id) => {
    return new Promise((resolve, reject) => {
        con.query('select * from tbl_transection WHERE user_id=? && amount_type=?',[id,3], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};
////////////////////     game apis function here    ///////////////////////////////
/// running game fetch
RunningGame = (id,game_status) => {
    return new Promise((resolve, reject) => {
        con.query('select tbl_game.game_id,tbl_game.creater_id, tbl_game.game_name, tbl_game.game_amount, tbl_game.game_time, tbl_game.game_date, tbl_game_join.user_id, tbl_game_join.user_type from tbl_game INNER JOIN tbl_game_join ON tbl_game.game_id = tbl_game_join.game_id WHERE tbl_game.status=? && tbl_game_join.user_id!=? && tbl_game.creater_id!=?',[game_status,id,id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};
/// my Gmae or find game by creater id
MyGame = (id,status) => {
    return new Promise((resolve, reject) => {
        con.query('select tbl_game.game_id,tbl_game.status, tbl_game.game_name, tbl_game.game_amount, tbl_game.game_time, tbl_game.game_date, user.username, user.image from tbl_game INNER JOIN user ON tbl_game.creater_id = user.id WHERE tbl_game.creater_id=? and tbl_game.status=?',[id,status], (error, elements) => {
            if (error) {
                return reject(error);
            }
            return resolve(elements);
        });
    });
};
///// check game from Game Join and Game Tables
checkGameJoin = (id,game_status) => {
    return new Promise((resolve, reject) => {
        con.query('select tbl_game.game_id,tbl_game.creater_id, tbl_game.game_name,tbl_game.cat_id, tbl_game.game_amount, tbl_game.game_time, tbl_game.game_date, tbl_game_join.user_id, tbl_game_join.user_type from tbl_game INNER JOIN tbl_game_join ON tbl_game.game_id = tbl_game_join.game_id WHERE tbl_game.status=? && tbl_game_join.user_id=?',[game_status,id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

checkGameJoinByCat = (id,game_status,cat_id) => {
    return new Promise((resolve, reject) => {
        con.query('select tbl_game.game_id,tbl_game.creater_id, tbl_game.game_name,tbl_game.cat_id, tbl_game.game_amount, tbl_game.game_time, tbl_game.game_date, tbl_game_join.user_id, tbl_game_join.user_type from tbl_game INNER JOIN tbl_game_join ON tbl_game.game_id = tbl_game_join.game_id WHERE tbl_game.status=? && tbl_game_join.user_id=? && tbl_game.cat_id=?',[game_status,id,cat_id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};



////find game by status
findGameByStatus = (id) => {
    return new Promise((resolve, reject) => {
        con.query('select tbl_game.game_id, tbl_game.game_name, tbl_game.game_amount, tbl_game.game_time, tbl_game.game_date, user.username, user.image from tbl_game INNER JOIN user ON tbl_game.creater_id = user.id WHERE tbl_game.status=?',[id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};
//// find game by id
findGameByID = (id) => {
    return new Promise((resolve, reject) => {
        con.query('select tbl_game.game_id,tbl_game.status, tbl_game.game_name, tbl_game.total_amount, tbl_game.game_amount, tbl_game.game_time, tbl_game.game_date, user.username,user.device_token, user.image from tbl_game INNER JOIN user ON tbl_game.creater_id = user.id WHERE tbl_game.game_id=?',[id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

//// find result by game id
gameResult = (game_id) => {
    return new Promise((resolve, reject) => {
        con.query('SELECT tbl_game_winner.winner_id, tbl_game_winner.ticket_id, tbl_game_winner.winner_type, tbl_game_winner.winning_amount, tbl_game_winner.creater_id, tbl_game_winner.id, tbl_game_winner.status, user.id, user.username, user.image, user.available_balance, user.available_coin FROM tbl_game_winner INNER JOIN user ON tbl_game_winner.winner_id = user.id WHERE tbl_game_winner.game_id=?',[game_id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};


//// find user already buy ticket or not
findUserPresent = (id,uid) => {
    return new Promise((resolve, reject) => {
        con.query('select * from `tbl_game_join` WHERE game_id=? and user_id=?',[id,uid], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};


//// insert new game
insertGame = (game_id, uid, game_date, game_time, game_amount, game_name, cat_id) => {
    return new Promise((resolve, reject) => {
        con.query('INSERT INTO tbl_game (`game_id`, `creater_id`, `game_date`, `game_time`, `game_amount`, `game_name`, `c_date`, `status`, `total_amount`,`cat_id`) VALUES (?,?, ?, ?,?,?,?,?,?,?)',
            [game_id, uid, game_date, game_time, game_amount, game_name, Date.now(), 1, game_amount, cat_id], (error, result) => {
                if (error) return reject(error);
                return resolve(result.insertId);
            });
    });
};


updateGameAmount = (game_id, total_amount) => {
    return new Promise((resolve, reject) => {
        con.query('UPDATE tbl_game SET `total_amount`=? WHERE game_id=?',[total_amount, game_id], (error, elements)=>{
        	if(error) return reject(error);
        	return resolve(elements)
        	});
    });
};


MyJoinGame = (uid, user_type) => {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM tbl_game_join WHERE user_id=? && user_type=?',[uid, user_type], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

updateGameBYID = (game_id, status) => {
    return new Promise((resolve, reject) => {
        con.query('UPDATE tbl_game SET `status`=? WHERE game_id=?',[status, game_id], (error, elements)=>{
        	if(error) return reject(error);
        	return resolve(elements)
        	});
    });
};

deleteGame = (game_id, uid) => {
    return new Promise((resolve, reject) => {
        con.query('DELETE FROM `tbl_game` WHERE game_id=? and user_id=?',[game_id,uid], (error, elements)=>{
        	if(error) return reject(error);
        	return resolve(elements)
        	});
    });
};


////////////////////     Ticket apis function here    ///////////////////////////////
//// create ticket
insertTicket = (game_id, uid, joiner, ticket, tiket) => {
    return new Promise((resolve, reject) => {
        con.query('INSERT INTO `tbl_game_join`(`game_id`, `user_id`, `user_type`, `ticket_id`, `ticket_number`,`ticket_date`, `status`) VALUES (?,?, ?,?, ?,?,?)',
            [game_id, uid, joiner, ticket, tiket, Date.now(), 1], (error, result) => {
                if (error) return reject(error);
                return resolve(result.insertId);
            });
    });
};
//// find My ticket by user id and game id
MyTicket = (game_id, uid) => {
    return new Promise((resolve, reject) => {
        con.query('SELECT game_id, user_id, user_type, ticket_id, ticket_number, ticket_date, status FROM tbl_game_join WHERE game_id=? and user_id=?',[game_id, uid], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};


////////////////////     Ticket apis function here    ///////////////////////////////
/// insert transection
insertTrans = (t_id, uid, des, game_amount, amount_type, ticket, t_type) => {
    return new Promise((resolve, reject) => {
        con.query('INSERT INTO tbl_transection (`transection_id`, `user_id`, `des`, `amount`,`amount_type`, `get_from`, `transection_type`, `t_date`, `status`) VALUES (?,?, ?,?, ?,?, ?,?,?)',
            [t_id, uid, des, game_amount,amount_type, ticket, t_type, Date.now(), 1], (error, result) => {
                if (error) return reject(error);
                return resolve(result.insertId);
            });
    });
};

checkPaymentDist = (uid, ref) => {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM tbl_transection WHERE user_id=? and get_from=?', [ref,uid], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};


////////////////////     User apis function here    ///////////////////////////////
////find game by id
findUserByID = (id) => {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM user WHERE id=?', [id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

findUserBySponcerID = (id) => {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM user WHERE referral_id=?', [id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

findPaymentByPhone = (id) => {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM tbl_payment WHERE phone=?', [id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

findUserByPhone = (id) => {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM user WHERE phone=?', [id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};


CheckSocialFb = (id) => {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM user WHERE facebook=?', [id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};


CheckSocialGoogle = (id) => {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM user WHERE googleplus=?', [id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

CheckSocialApple = (id) => {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM user WHERE apple=?', [id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

//////////////////////////////    wallet update    //////////////////////
///// update coin wallet
updateUserCoinWallet = (id,value) =>{
		return new Promise((resolve, reject) =>{
        con.query('UPDATE user SET available_coin=? WHERE id =?', [value, id], (error, elements)=>{
        	if(error) return reject(error);
        	return resolve(elements)
        	});
        });
}
//// update balance wallet
updateUserBalanceWallet = (id,value) =>{
		return new Promise((resolve, reject) =>{
        con.query('UPDATE user SET available_balance=? WHERE id =?', [value, id], (error, elements)=>{
        	if(error) return reject(error);
        	return resolve(elements)
        	});
        });
}
//// update both wallet
updateUserBothWallet = (id,value) =>{
		return new Promise((resolve, reject) =>{
        con.query('UPDATE user SET available_balance=?, available_coin=? WHERE id =?', [0,value, id], (error, elements)=>{
        	if(error) return reject(error);
        	return resolve(elements)
        	});
        });
}

//////
updateUserRefSponcer = (phone,ref,sponcer) =>{
		return new Promise((resolve, reject) =>{
        con.query('UPDATE user SET referral_id=?, sponsor_id=? WHERE phone =?', [ref,sponcer, phone], (error, elements)=>{
        	if(error) return reject(error);
        	return resolve(elements)
        	});
        });
}
///////////////////////////          waiting Room       //////////////////////////////
//// waiting room
WaitingRoom = (id) => {
    return new Promise((resolve, reject) => {
        con.query('select tbl_game_join.user_id, tbl_game_join.ticket_id, tbl_game_join.user_type, tbl_game_join.game_id, user.username,user.device_token, user.image from tbl_game_join INNER JOIN user ON tbl_game_join.user_id = user.id WHERE tbl_game_join.game_id=?',[id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

Distribution = () => {
    return new Promise((resolve, reject) => {
        con.query('select * from tbl_game_dist',[], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

CreateTambolaNumber = (game_id, uid, numbers) => {
    return new Promise((resolve, reject) => {
        con.query('INSERT INTO tbl_tambola_number (`game_id`, `user_id`, `game_number`, `start_time`, `status`) VALUES (?, ?,?, ?,?)',
            [game_id, uid, numbers, Date.now(), 1], (error, result) => {
                if (error) return reject(error);
                return resolve(result.insertId);
            });
    });
};


GameNumber = (game_id) => {
    return new Promise((resolve, reject) => {
        con.query('select game_number, user_id, live_number, number_time FROM tbl_tambola_number WHERE game_id=?',[game_id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

UpdateLiveNumber = (game_id, live_number,number_time) =>{
		return new Promise((resolve, reject) =>{
        con.query('UPDATE tbl_tambola_number SET live_number=?, number_time=? WHERE game_id =?', [live_number, number_time, game_id], (error, elements)=>{
        	if(error) return reject(error);
        	return resolve(elements)
        	});
        });
}

UpdateGameStatus = (game_id,uid,  status) =>{
		return new Promise((resolve, reject) =>{
        con.query('UPDATE tbl_game SET status=? WHERE game_id =? and creater_id=?', [status, game_id, uid], (error, elements)=>{
        	if(error) return reject(error);
        	return resolve(elements)
        	});
        });
}



/////////// claim system  ////////////
////////findclaim
claimType = () => {
    return new Promise((resolve, reject) => {
        con.query('select claim_type, id FROM tbl_claim_type WHERE status=1', (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};


findUserInvitation = () => {
    return new Promise((resolve, reject) => {
        con.query('select id FROM tbl_game_invitation WHERE status=1', (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

/////////// claim by id   ///////////
claimByID = (id) => {
    return new Promise((resolve, reject) => {
        con.query('select claim_type, id, distribution FROM tbl_claim_type WHERE id=?',[id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};


/////////////////////////////    winner system    ////////////////////////
getAllWinnerByGameID = (id) => {
    return new Promise((resolve, reject) => {
        con.query('select * FROM tbl_game_winner WHERE game_id=?',[id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

getAllWinnerByGameIDType = (id, type) => {
    return new Promise((resolve, reject) => {
        con.query('select * FROM tbl_game_winner WHERE game_id=? and winner_type=?',[id,type], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

getUserByGameID = (id) => {
    return new Promise((resolve, reject) => {
        con.query('select tbl_game.creater_id, user.id, user.device_token from tbl_game INNER JOIN user ON tbl_game.creater_id = user.id WHERE tbl_game.game_id=?',[id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};

/////////////////////////      insert Winner      ///////////////////
insertWinner = (game_id, creater, winner, ticket_id, winner_type, amount) => {
    return new Promise((resolve, reject) => {
        con.query('INSERT INTO `tbl_game_winner`(`game_id`, `creater_id`, `winner_id`, `ticket_id`, `winner_type`, `status`, `winning_amount`) VALUES (?,?, ?,?,?,?,?)',
            [game_id, creater, winner, ticket_id, winner_type,1,amount], (error, result) => {
                if (error) return reject(error);
                return resolve(result.insertId);
            });
    });
};


insertPayment = (phone, amount,order_id, payment_id, p_time) => {
    return new Promise((resolve, reject) => {
        con.query('INSERT INTO tbl_payment (`phone`, `amount`, `order_id`, `payment_id`, `p_time`, `status`) VALUES (?,?,?,?, ?,?)',
            [phone, amount,order_id, payment_id, p_time, 1], (error, result) => {
                if (error) return reject(error);
                return resolve(result.insertId);
            });
    });
};

insertPaymentRequest = (phone, amount,utr, method, date) => {
    return new Promise((resolve, reject) => {
        con.query('INSERT INTO `tbl_payment_request`(`phone`, `amount`, `utr`, `method`, `p_date`) VALUES (?,?,?,?, ?)',
            [phone, amount,utr, method, date], (error, result) => {
                if (error) return reject(error);
                return resolve(result.insertId);
            });
    });
};

requestFindByPhone = (id) => {
    return new Promise((resolve, reject) => {
        con.query('SELECT * FROM tbl_payment_request WHERE phone=?', [id], (error, elements) => {
            if (error) return reject(error);
            return resolve(elements);
        });
    });
};


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post("/create/:token", async (req, res) => {
    console.log("create game 503");
	console.log(req.body)
    if (!req.params.token || !req.body.game_name || !req.body.game_date || !req.body.game_time || !req.body.game_amount || !req.body.uid || !req.body.cat_id) { res.send({ success: false, msg: "Access Denied or Send all parameter" }); console.log("here")}
    else {
    	let resultUser = await findUserByID(req.body.uid);
    	let totalAmount = resultUser[0].available_coin + resultUser[0].available_balance;
    	// console.log(totalAmount)
    	if( req.body.game_amount <= totalAmount){
        const game_id = await isGame(20);
        const ticket = await isGame(10);
        if( req.body.game_amount <= resultUser[0].available_coin)
        {
        	let remainingWallet = resultUser[0].available_coin - req.body.game_amount;
         	let updateUser = await updateUserCoinWallet(req.body.uid, remainingWallet);
        	// res.send({ success: true, msg: 'Amount Deducted from coin wallet successfully', avilable_coin:remainingWallet});
        }
        else if( req.body.game_amount < resultUser[0].available_balance)
        {
        	let remainingWallet = resultUser[0].available_balance - req.body.game_amount;
        	let updateUser = await updateUserBalanceWallet(req.body.uid, remainingWallet);
        	// res.send({ success: true, msg: 'Amount Deducted from Balance wallet successfully', avilable_coin:remainingWallet});
        }
        else{
        	let remainingWallet = totalAmount - req.body.game_amount;
        	let updateUser = await updateUserBothWallet(req.body.uid, remainingWallet);
        	// res.send({ success: true, msg: 'Amount Deducted from both wallet successfully', avilable_coin:remainingWallet});
        }
        let t_id = await isGame(15);
    	let des = "Amount deducted due to game table ID: " + game_id + " and Ticket ID : " + ticket;
        let t_type = 0;
    	let resultTrans = await insertTrans(t_id, req.body.uid, des, req.body.game_amount,0, ticket, t_type);
        let resultGame = await insertGame(game_id, req.body.uid, req.body.game_date, req.body.game_time, req.body.game_amount, req.body.game_name, req.body.cat_id);
        // console.log(resultGame);
    	var array = await tambola.generateTicket();
    	var tiket = await array.join();
        let joiner = 1;
    	let resultTicket = await insertTicket(game_id, req.body.uid, joiner, ticket, tiket);
    	// console.log(resultTicket);
    	// console.log(resultTrans);
        let deviceToken = await getUserByGameID(game_id)
        // console.log(deviceToken)
        var dataPush={
                     "title": 'Game Created',
                     "body": req.body.game_name + " game created sucessfully with Ticket amount : "+req.body.game_amount
                     }
        sendPushNotification(deviceToken[0].device_token,dataPush)
        res.send({ success: true, msg: 'Game created successfully', game_id: game_id });
        }
    	else res.send({ success: false, msg: 'Low Balance Recharge Your wallet', avilable_coin:totalAmount});
    }
});



app.post("/join/:token", async (req, res) => {
console.log(req.body)
    console.log("find game details  join api 550");
    if (!req.params.token) res.send({ success: false, msg: "Access Denied" });
    else if (!req.body.game_id || req.body.game_id == "") res.send({ success: false, msg: "Enter Game ID" });
    else {
    try{
    	let resultGame = await findGameByID(req.body.game_id);
    	if(!resultGame || resultGame == ""){ res.status(200).json({status:false,msg:"No Game Found"}) }
    	else res.status(200).json({status:true,msg:"Game Details",data:resultGame})
    	} catch (e){
    	console.log(e)
    	res.sendStatus(500);
    	}
    }
});


app.post("/buyTicket/:token", async (req, res) => {
console.log(req.body)
console.log("buy ticket 566");
    if (!req.params.token) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        
        let resultGame = await findGameByID(req.body.game_id);
        let UserPresent = await findUserPresent(req.body.game_id, req.body.uid);
        // console.log(UserPresent)
        if(UserPresent ==""){
        let resultUser = await findUserByID(req.body.uid);
        // console.log(resultUser[0].available_coin)
    	let totalAmount = resultUser[0].available_coin + resultUser[0].available_balance;
        let game_amount = resultGame[0].game_amount;
        let total_amount = resultGame[0].total_amount;
        // res.send({ success: true, msg: 'Joined successfully', game_id: resultGame });
    	if( game_amount <= totalAmount){
    	const game_id = req.body.game_id;
    	const ticket = await isGame(10);
    	if( game_amount <= resultUser[0].available_coin)
    	{
    	let remainingWallet = resultUser[0].available_coin - game_amount;
    	let updateUser = await updateUserCoinWallet(req.body.uid, remainingWallet);
    	// res.send({ success: true, msg: 'Amount Deducted from coin wallet successfully', avilable_coin:remainingWallet});
    	}
    	else if( game_amount < resultUser[0].available_balance)
    	{
    	let remainingWallet = resultUser[0].available_balance - game_amount;
    	let updateUser = await updateUserBalanceWallet(req.body.uid, remainingWallet);
    	// res.send({ success: true, msg: 'Amount Deducted from Balance wallet successfully', avilable_coin:remainingWallet});
    	}
    	else{
    	let remainingWallet = totalAmount - game_amount;
    	let updateUser = await updateUserBothWallet(req.body.uid, remainingWallet);
    	// res.send({ success: true, msg: 'Amount Deducted from both wallet successfully', avilable_coin:remainingWallet});
    	}
    	const t_id = await isGame(15);
        total_amount = total_amount + game_amount;
        let updateGame = await updateGameAmount(game_id, total_amount)
        // console.log(total_amount)
    	let des = "Amount deducted due to Join game table ID: " + game_id + " and Ticket ID : " + ticket;
        let t_type = 0;
    	let resultTrans = await insertTrans(t_id, req.body.uid, des, game_amount,0, ticket, t_type);
    	var array = await tambola.generateTicket();
    	var tiket = await array.join();
    	let joiner =0;
    	let resultTicket = await insertTicket(game_id, req.body.uid, joiner, ticket, tiket);
        let deviceToken = await getUserByGameID(game_id)
        // console.log(deviceToken)
        var dataPush={
                     "title": 'Game Joined',
                     "body": resultUser[0].username + ' join the game with ticket amount : '+game_amount +" game name : "+ resultGame[0].game_name
                     }
        sendPushNotification(deviceToken[0].device_token,dataPush)
    	res.send({ success: true, msg: 'Joined successfully', game_id: game_id });
    	}
        else res.send({ success: true, msg: 'Low Balance Recharge Your wallet', avilable_coin:totalAmount});
        }
        else res.send({ success: true, msg: 'You have already purchased ticket for this game', ticket_id:UserPresent[0].ticket_id});
        }catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.sendStatus(500);
        }
    }
});
///// live running game waiting for play
app.post("/running_game/:token", async (req, res) => {
console.log(req.body)
    console.log("Running Game OLD 625");
    if (!req.params.token || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
            let game_status =1; let user_type = 1; //////user type 1 means creator
        	let checkGame = await RunningGame(req.body.uid, game_status)
            if(checkGame !=""){
            for(i=0; i< checkGame.length; i++){
        			let time = checkGame[i].game_time;
        			let data = time.toString().split(":")
        			let hr = data[0]
            		let min = data[1]
                    let userDetails = await findUserByID(checkGame[i].creater_id)
                    // console.log(userDetails[0].username, userDetails[0].image)
                    Object.assign(checkGame[i],{hours:hr},{minutes:min},{username:userDetails[0].username},{image:userDetails[0].image})
                    }
            }
        	if(checkGame != "") res.status(200).json({ success: true, msg: "Game List", elements: checkGame});
        	else res.status(500).json({ success: false, msg: "No game found"});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "No Game Found" });
        }
    }
});

/// my game created by user
app.post("/my_game/:token", async (req, res) => {
console.log(req.body)
    console.log("My Game OLD 654");
    if (!req.params.token || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        	let game_status =1; let user_type = 1; //////user type 1 means creator
        	let checkGame = await checkGameJoin(req.body.uid, game_status)
            if(checkGame !=""){
            for(i=0; i< checkGame.length; i++){
        			let time = checkGame[i].game_time;
        			let data = time.toString().split(":")
        			let hr = data[0]
            		let min = data[1]
                    let userDetails = await findUserByID(checkGame[i].creater_id)
                    // console.log(userDetails[0].username, userDetails[0].image)
                    Object.assign(checkGame[i],{hours:hr},{minutes:min},{username:userDetails[0].username},{image:userDetails[0].image})
                    }
            }
        	if(checkGame != "") res.status(200).json({ success: true, msg: "Game List", elements: checkGame});
        	else res.status(500).json({ success: false, msg: "No game found"});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "No Game Found" });
        }
    }
});


// /// my game created by user
app.post("/my_game_check/:token", async (req, res) => {
console.log(req.body)
    console.log("checking 682");
    if (!req.params.token || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        	let game_status =1; let user_type = 0; //////user type 1 means creator
            const resultMy = await MyGame(req.body.uid,game_status);
        		for(i=0; i< resultMy.length; i++){
        			let time = resultMy[i].game_time;
        			let data = time.toString().split(":")
        			let hr = data[0]
            		let min = data[1]
                    // console.log(data)
                    Object.assign(resultMy[i],{hours:hr},{minutes:min})
                    }
        	let GameDetails="";
        	const resultJoin = await MyJoinGame(req.body.uid, user_type);
        	const combined = resultMy.concat(GameDetails)
        	// console.log(combined )
        	if(combined != "") res.status(200).json({ success: true, msg: "Game List", elements:combined});
        	else res.status(500).json({ success: false, msg: "No game found"});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "No Game Found" });
        }
    }
});





/// Waiting Room by user
app.post("/waitingRoom/:token", async (req, res) => {
console.log(req.body)
    console.log("waiting room 715");
    if (!req.params.token || !req.body.game_id || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
            const resultWait = await WaitingRoom(req.body.game_id);
        	// console.log({data:resultWait})
        	if(resultWait !="")	res.status(200).json({ success: true, msg: "User List", elements: resultWait });
        	else res.status(500).json({ success: false, msg: "No waiting Room Found"});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "No Game Found" });
        }
    }
});



/// Waiting Room by user
app.post("/myTicket/:token", async (req, res) => {
console.log(req.body)
    console.log("My ticket 734");
    if (!req.params.token || !req.body.game_id || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
            const resultTicket = await MyTicket(req.body.game_id, req.body.uid);
        	// console.log({data:resultTicket})
        	if(resultTicket !="")	res.status(200).json({ success: true, msg: "User List", game_id: resultTicket[0].game_id, user_id: resultTicket[0].user_id, user_type: resultTicket[0].user_type, ticket_id: resultTicket[0].ticket_id, ticket_number: resultTicket[0].ticket_number, ticket_date: resultTicket[0].ticket_date, status: resultTicket[0].status, });
        	else res.status(500).json({ success: false, msg: "No waiting Room Found"});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Error No Game Found" });
        }
    }
});


/// Waiting Room by user
app.post("/startGame/:token", async (req, res) => {
console.log(req.body)
    console.log("start game 752");
    if (!req.params.token || !req.body.game_id || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
    else {
        try {	
        	let numbers = [];
        	let resultGame = await findGameByID(req.body.game_id);
        	if(resultGame != ""){
        	let number = await tambola.getDrawSequence();
        	numbers = await number.join();
            let resultNumber = await CreateTambolaNumber(req.body.game_id, req.body.uid, numbers);
        	let tableComission = await comissionList();
        	let creatorComission = (resultGame[0].total_amount/tableComission[0].creator);
    		let des = "Game Table ID :- "+ req.body.game_id +" Creation and Play Comission Amount:- " + creatorComission ;
        	let t_id = await isGame(15);
        	let t_type = 1;
    		let resultTrans = await insertTrans(t_id, req.body.uid, des, creatorComission,1, req.body.game_id, t_type);
            let updateGameStatus = await updateGameBYID(req.body.game_id, 0)
            let updateLiveNumber = await UpdateLiveNumber(req.body.game_id,0,((Date.now())+(15*1000)))
        	// console.log({data:creatorComission})
            let deviceToken = await WaitingRoom(req.body.game_id)
            for(let noti = 0; noti < deviceToken.length; noti++){
        	var dataPush={
                     "title": 'Game Started',
                     "body": resultGame[0].game_name + " game created started"
                     }
        	sendPushNotification(deviceToken[noti].device_token,dataPush)
            // console.log(deviceToken[noti].device_token)
            }
        	res.status(200).json({ success: true, msg: "Ready to start the game"});
            }else res.status(500).json({ success: false, msg: "No game found"});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "No Game Found" });
        }
    }
});


app.post("/requestNumber/:token", async (req, res) => {
console.log(req.body)
    console.log("running number request number api 782");
	
    if (!req.params.token || !req.body.game_id || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        	let currentStatus =""; 
            const resultNumber = await GameNumber(req.body.game_id);
        	// console.log({resultNumber})
        	let checkTotalPlayer = await WaitingRoom(req.body.game_id)
        	if(resultNumber !=""){
        	let number = resultNumber[0].live_number;
        	let current = await findGameByID(req.body.game_id);
        	var game_number = [resultNumber[0].game_number];
        	let msg = "";
        	if(current[0].status == 1){ currentStatus = "0"; msg="Waiting for Admin to Start Game";}else{currentStatus = "1"; msg="Game Started";} 
            if(number>=90){ let updateGameStatus = await UpdateGameStatus(req.body.game_id, req.body.uid, 0); currentStatus = "2"; msg="Game Finshed please join new game";}
        	// console.log(current[0].status, number)
        	let data = await game_number.toString().split(",")
            if(Date.now()>resultNumber[0].number_time){
            let liveNumber = number +1;
            let updateLiveNumber = await UpdateLiveNumber(req.body.game_id,liveNumber,((Date.now())+(15*1000)))
            }
            let prev = "";
            if(number==0){ prev = "?";}else{ prev = data[(number-1)];}
            console.log({currentPosition:(resultNumber[0].live_number+1)})
        	res.status(200).json({ success: true, msg: msg, currentNumber:data[number], previousNumber:prev, currentPosition:(resultNumber[0].live_number+1), currentStatus:currentStatus, players:`${checkTotalPlayer.length}`});}
        	else res.status(500).json({ success: false, msg: "Waiting for Admin to Start Game", players:`${checkTotalPlayer.length}`});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Waiting for Admin to Start Game" });
        }
    }
});


app.post("/claimType/:token", async (req, res) => {
console.log(req.body)
    console.log("ClaimType 818");
    if (!req.params.token || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
            const claim = await claimType();
        	// console.log(claim)
        	if(claim !="")	res.status(200).json({ success: true, msg: "Claim types", resultNumber:claim});
        	else res.status(500).json({ success: false, msg: "No game found"});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Error No Game Found" });
        }
    }
});


// app.post("/requestClaim/:token", async (req, res) => {
// console.log(req.body)
//     console.log("request claim 835");
// 	// console.log(req.body);
//     if (!req.params.token || !req.body.game_id || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
//     else {
//         try {
//         	let ticketNumber= "";
//         	let tiki=[];
//         	let data = "";
//         	let Number = [];
//         	let Numbers = [];
//         	tiki = await (req.body.ticket_number).toString().split(",")        	
//         	let claim = await claimByID(req.body.claim_type);
//         	let FindGame = await findGameByID(req.body.game_id)
//         	// console.log(claim)
//         	let myTicket = await MyTicket(req.body.game_id,req.body.uid)
//             // console.log(myTicket)
//         	if(!myTicket) {res.status(500).json({ success: false, msg: "No Ticket found"})}
//         	else if(myTicket[0].status == 0) {res.send({ success		: false, msg: "Ticket Already in use"})}
//         	else { 
//             		var ticket_number = [myTicket[0].ticket_number];
//         			let data = ticket_number.toString().split(",")
//             		let i =""; let j="";
//             		if(req.body.claim_type == 1) {i=0;j=8;}
//             		else if(req.body.claim_type == 2) {i=9;j=17;}
//             		else if(req.body.claim_type == 3) {i=18;j=26;}
//             		else if(req.body.claim_type == 4) {i=0;j=26;}
//             		else {i=0;j=0;}
//             		for(i=i; i<=j; i++){
//                     	Number.push(data[i]);
//                     }
//             		let arrayMatch = await arrayEquals(Number, tiki)
//                     console.log(Number, tiki ,arrayMatch)
//         			if(arrayMatch==false){ res.status(500).json({ success: false, msg: "You are trying wrong Mathod"}); }
//         			else{
//         			let gameNumber = await GameNumber(req.body.game_id);
//         			var game_number = [gameNumber[0].game_number];
//         			let data = game_number.toString().split(",");
//         			for(i=0; i<req.body.running_number; i++){
//         			Numbers.push(data[i]);
//         			}
//         			let check = await removeItemAll(Number,"0");
//         			let containsAll = await check.every(element => {return Numbers.includes(element)});
//         			if(containsAll ==false){ res.status(500).json({ success: false, msg: "Ticket is not fully matched"});}
//         			else{
//         			let fetchWinner = await getAllWinnerByGameIDType(req.body.game_id, req.body.claim_type);
//         			let fetchPlayer = await WaitingRoom(req.body.game_id);
//         			// let TotalWinner = Math.floor((fetchPlayer.length*claim[0].distribution)/100)
//         			let totalPlayer = fetchPlayer.length;
//         			let Prize = await EachLevelWinner();
//         			let EachLevelPrizeToWinner = Prize[0].player_each_level;
//         			let TotalWinner = await Math.floor((100*claim[0].distribution)/100);
//         			let EachClaimWinner = (TotalWinner*EachLevelPrizeToWinner)/100;
//         			// console.log(EachClaimWinner , fetchWinner.length, totalPlayer)
//         			if(EachClaimWinner > fetchWinner.length){
//         			let winnerInsert = await insertWinner(req.body.game_id, gameNumber[0].user_id, req.body.uid, req.body.ticket_id, req.body.claim_type,0)
//         			res.status(200).json({ success: true, msg: "Claim Successfull Applied", winnerInsert:winnerInsert})
//         			}else{
//         			res.status(500).json({ success: true, msg: "Claim is already full"});
//         			}
//         			}
//         			}
//             }
//         } catch (e) {
//             console.log(e); // console log the error so we can see it in the console
//             res.status(500).json({ success: false, msg: "Error No Game Found" });
//         }
//     }
// });




app.post("/gameResult/:token", async (req, res) => {
console.log(req.body)
console.log("Result 907")
    console.log("Game Result");
    if (!req.params.token || !req.body.game_id || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        	let gameResultData = await gameResult(req.body.game_id);
        	// console.log(gameResultData)
        	if(!gameResultData || gameResultData =="") res.status(500).json({ success: false, msg: "No Result found"});
        	else res.status(200).json({ success: true, msg: "Game Over", data:gameResultData});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Error No Game Found" });
        }
    }
});


app.post("/checkPhone", async (req, res) => {
console.log(req.body)
console.log("Check Phone 924")
    if (!req.body.phone) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        	let checkNew = await findPaymentByPhone(req.body.phone);
        	if(checkNew !=""){
            	res.status(200).json({ success: true, msg:'Already Exixt'});
        		}
        	else{
             // let insertNewUser = await insertUser(req.body.phone);
        	 res.status(200).json({ success: false, msg:'New Entry'});
            }
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "No Data Found" });
        }
    }
});

app.post("/otpRequest", async (req, res) => {
console.log(req.body)
console.log("Request OTP 943")
    if (!req.body.phone) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        	let checkSpo = "";
        	if(!req.body.ref || req.body.ref =="null"){checkSpo = "ok"}else{
        	checkSpo = await findUserBySponcerID(req.body.ref);
            }
            // console.log({check:checkSpo,spo:"not found",ref:""+req.body.ref})
            if(checkSpo == ""){res.status(200).json({ success: false, msg:"Invalid Referral Code"});}
            else{
        	let checkNew = await checkNewUser(req.body.phone);
        	// console.log(checkNew)
        	let otp = await isOtp(4);
        	let msg="";
        	let isRegister="";
        	if(checkNew ==""){
        		let insertNewUser = await insertUser(req.body.phone, otp, req.body.ref);
            	msg="Your referall user name is "+checkSpo[0].username+". Otp Sent Successfully";
        		console.log({status:true, otp:otp, msg:"New entry"});
        		}
        	else{
            if(!req.body.ref){
            let updateUser = await UpdateUserOTP(req.body.phone, otp);
            // console.log("ref found")
            msg="Otp Sent Successfully";
            }else{
            let updateUser = await UpdateUserOTPRef(req.body.phone, otp, req.body.ref);
            msg="Your referall user name is "+checkSpo[0].username+". Otp Sent Successfully";
            // console.log("herer")
            }
        		// console.log({ status:true, otp:otp, msg:"update"});
        	}
            res.status(200).json({ success: true, msg: msg,otp:otp});
            }
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Error" });
        }
    }
});

app.post("/matchOtp", async (req, res) => {
console.log(req.body)
console.log("Match OTP 970")
    if (!req.body.phone || !req.body.otp) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        let name = ""
            let username = ""
            let email = ""
            let googleplus =""; let facebook="";let apple=""
        	let checkNew = await checkPhoneOtp(req.body.phone, req.body.otp);
        	let msg="";let isRegister="";let otp_status="";
        	console.log(checkNew)
        	if(checkNew ==""){
            	msg="Otp not matched";
            	otp_status=false;	
            res.status(200).json({ success: otp_status, msg: msg});
            }
        	else{
            otp_status=true;
            isRegister="0";
            msg="Otp matched, Payment Required";
            let checkPayment = await findPaymentByPhone(req.body.phone);
            // console.log(checkPayment)
            if(checkPayment !=""){
            isRegister="1";
            msg="Payment successful. Social Login Required";
            let checkUser = await findUserByPhone(req.body.phone);
            if(checkUser !=""){
            isRegister="2";
            msg="Payment successful. Social Login Done";
            // console.log(checkUser)
            name = checkUser[0].username;
            username = checkUser[0].username;
            email = checkUser[0].email;
            googleplus = checkUser[0].googleplus;
            facebook = checkUser[0].facebook;
            apple = checkUser[0].apple;
            }
            }
            let gateway_status = 0; ////// 0- payment gateway, 1- qr code / upi id, not in u2- links
			// let gateway_name = "razorpay";
			// let private_key = "rzp_test_uo7EKPwYEXwGNZ"; /// rozarpay
			// let secret_key = "oKv8GlgyeMMo0VzXwd3H0X7g";
            
            let gateway_name = "stripe";
            let private_key = "pk_live_51Jfi9USCDdW0qyGauggBF1hxK9fFWVwwTCaRzQLLXzpSd8lypviGKV1LAE3HIMb8ec0RQHAa1VJqiCTH3HveKOOo00y35qXThH"; /// stripe
            let secret_key = "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"; ///stripe
			let qr_code = "https://kittyclub.in/uploads/qr_code.png";
        	let upi_id = "8950528203@ybl";
			let payment_link=["link1","link1","link1","link1","link1"];
        	res.status(200).json({ success: otp_status, msg: msg, isRegister:isRegister, name:name, username:username, email:email, facebook:facebook, apple:apple, googleplus:googleplus, gateway_status:gateway_status, gateway_name:gateway_name, private_key: private_key,secret_key:secret_key,  qr_code: qr_code, payment_link:payment_link, upi_id:upi_id });
            }
        
             // console.log({ success: otp_status, msg: msg, isRegister:isRegister, name:name, username:username, email:email, facebook:facebook, apple:apple, googleplus:googleplus})
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Error No Game Found" });
        }
    }
});

app.post("/paymentConformRequest", async (req, res) => {
console.log(req.body);
let insertNewUser = await insertPaymentRequest(req.body.phone,req.body.amount,req.body.utr,req.body.method,req.body.p_date);
let msg ="";
let checkNew = await findPaymentByPhone(req.body.phone);
        	if(checkNew ==""){
        		let insertNewUser = await insertPayment(req.body.phone,req.body.amount,req.body.utr,req.body.utr,req.body.p_date);
            	msg="Payment Successfully";
        		}
        	else{
            	msg="Duplicate entry found";
            }
msg = msg +"please wait for 24 hrs for account activation and verification !!!";
res.status(200).json({ success: true, msg: msg});
});
         
         
app.post("/getPaymentConformRequest", async (req, res) => {
console.log(req.body)
let insertNewUser = await requestFindByPhone(req.body.phone);
				if(insertNewUser !=""){
            	let msg="Request list found successfully";
				res.status(200).json({ data:insertNewUser,success: true, msg: msg});
        		}else{
          			let msg="Request list not found successfully";
          			res.status(200).json({ success: true, msg: msg});
                }
});


app.post("/paymentRequest", async (req, res) => {
console.log(req.body)
console.log("P Request API 1014")
    if (!req.body.phone || !req.body.payment_id || !req.body.order_id || !req.body.p_time) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        let msg="";
        	let checkNew = await findPaymentByPhone(req.body.phone);
        	if(checkNew ==""){
            	let amount = req.body.amount/100;///////////////// amount adjustment
        		let insertNewUser = await insertPayment(req.body.phone,amount,req.body.order_id,req.body.payment_id,req.body.p_time);
            	msg="Payment Successfully";
        		}
        	else{
            	msg="Duplicate entry found";
            }
        	 res.status(200).json({ success: true, msg: msg});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});


app.get("/gameCatergoy/:token", async (req, res) => {
console.log(req.body)
console.log("Game Category API 1036 GET")
    if (!req.params.token) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        	let checkNew = await findGameCat();
        	 res.status(200).json({success: true, message:"Record list found",data:checkNew});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});

app.post("/gameCatergoy/:token", async (req, res) => {
console.log(req.body)
console.log("Game Category API 1049 POST")
    if (!req.params.token) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        	let checkNew = await findGameCat();
        	 res.status(200).json({success: true, message:"Record list found",data:checkNew});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});

app.post("/allGame/:token", async (req, res) => {
console.log(req.body)
console.log("All Game API 1062")
    if (!req.params.token || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        let checkNew = "";let status=1;
        if(req.body.cat_id!=""){
        	checkNew = await findGameCatID(req.body.cat_id, status);
        }else{
        	checkNew = await findAllGame(status);
        }
        if(checkNew !=""){
        let gameStatus=""; let checkGame=""
            for(i=0; i< checkNew.length; i++){
            		gameStatus=0;
            		if(req.body.uid == checkNew[i]['creater_id']){
                    gameStatus=1;
                    }else{
                    	checkGame = await findUserPresent(checkNew[i]['game_id'], req.body.uid);
                    	if(checkGame !=""){gameStatus=2;}
                    console.log(checkGame, gameStatus)
                    }
        			let time = checkNew[i].game_time;
        			let data = time.toString().split(":")
                    // var ts = Date.parse("2010-10-29");
            		console.log(checkNew[i].game_date +""+ checkNew[i].game_time)
        			let hr = data[0]
            		let min = data[1]
                    let userDetails = await findUserByID(checkNew[i].creater_id)
                    let count = await WaitingRoom(checkNew[i].game_id)
                    // console.log(userDetails[0].username, userDetails[0].image)
                    Object.assign(checkNew[i],{hours:hr},{minutes:min},{username:userDetails[0].username},{image:userDetails[0].image},{gameStatus:gameStatus},{members:count.length})
                    }
            }
        res.status(200).json({ success: true, msg: "Game List", data:checkNew});
        // console.log(checkNew)
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});

app.post("/gameMy/:token", async (req, res) => {
console.log(req.body)
console.log("My Game Api 1140")
    if (!req.params.token || !req.body.uid || !req.body.cat_id) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        let checkNew = "";let status=1;
        	checkNew = await findGameCatIdUid(req.body.uid,req.body.cat_id, status);
        if(checkNew !=""){
            for(i=0; i< checkNew.length; i++){
        			let time = checkNew[i].game_time;
        			let data = time.toString().split(":")
        			let hr = data[0]
            		let min = data[1]
                    let userDetails = await findUserByID(checkNew[i].creater_id)
                    let count = await WaitingRoom(checkNew[i].game_id)
                    // console.log(userDetails[0].username, userDetails[0].image)
                    Object.assign(checkNew[i],{hours:hr},{minutes:min},{username:userDetails[0].username},{image:userDetails[0].image},{gameStatus:1},{members:count.length})
                    }
            }
        res.status(200).json({ success: true, msg: "Game List", data:checkNew});
        // console.log(checkNew)
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});


app.post("/joinedGame/:token", async (req, res) => {
console.log(req.body)
console.log("My Joined Game API 1167")
    if (!req.params.token || !req.body.uid ) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        let status=1; let checkGame="";
        if(!req.body.cat_id || req.body.cat_id ==""){
        	checkGame = await checkGameJoin(req.body.uid, status)
        }else{
        	checkGame = await checkGameJoinByCat(req.body.uid, status,req.body.cat_id)
        }
        if(checkGame !=""){
            for(i=0; i< checkGame.length; i++){
        			let time = checkGame[i].game_time;
        			let data = time.toString().split(":")
        			let hr = data[0]
            		let min = data[1]
                    let userDetails = await findUserByID(checkGame[i].creater_id)
                    let count = await WaitingRoom(checkGame[i].game_id)
                    // console.log(userDetails[0].username, userDetails[0].image)
                    Object.assign(checkGame[i],{hours:hr},{minutes:min},{username:userDetails[0].username},{image:userDetails[0].image},{gameStatus:2},{members:count.length})
                    }
            }
        res.status(200).json({ success: true, msg: "Game List", data:checkGame});
        console.log(checkGame)
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});


app.post("/winnerList/:token", async (req, res) => {
console.log(req.body)
console.log("Gane Winner List")
    if (!req.params.token || !req.body.game_id || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        let winnerListData="";
        winnerListData = await GetWinnerList(req.body.game_id)
        // console.log(winnerListData)
        Object.assign(winnerListData,{game_name:"Game Name"},{game_amount:"100"})
        res.status(200).json({success:true, msg:'Winner list', data: winnerListData});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});

app.post("/allWinnerList/:token", async (req, res) => {
console.log(req.body)
console.log("All Winner List")
    if (!req.params.token || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        let winnerListData="";
        winnerListData = await GetAllWinnerList()
        console.log(winnerListData)
        for(let i=0; i<winnerListData.length; i++){
        Object.assign(winnerListData[i],{game_name:"Game Name"},{game_amount:"100"})
        }
        res.status(200).json({success:true, msg:'All Winner list', data: winnerListData});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});

app.post("/topWinnerList/:token", async (req, res) => {
console.log(req.body)
console.log("Top Winner List")
    if (!req.params.token || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        let winnerListData="";
        winnerListData = await GetTopWinnerList()
        console.log(winnerListData)
        for(let i=0; i<winnerListData.length; i++){
        Object.assign(winnerListData[i],{game_name:"Game Name"},{game_amount:"100"})
        }
        res.status(200).json({success:true, msg:'Top Winner list', data: winnerListData});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});



app.post("/getFollowers/:token", async (req, res) => {
console.log(req.body)
console.log("My follower / following API 1179")
    if (!req.params.token || !req.body.uid || !req.body.listType ) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        let getFollower="";
        if(req.body.listType == 0){
        getFollower = await GetFollower(req.body.uid)
        }else{
        getFollower = await GetFollowing(req.body.uid)
        }
        // console.log(getFollower)
        res.status(200).json({success:true, msg:'all user list', data: getFollower});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});


app.post("/sendInviteAll/:token", async (req, res) => {
console.log(req.body)
console.log("invite to all API 1221")
    if (!req.params.token || !req.body.uid || !req.body.game_id ) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        let sendInvitation=""
        let getFollower = await GetFollower(req.body.uid)
        let getFollowing = await GetFollowing(req.body.uid)
        let comb = getFollower.concat(getFollowing)
        if(comb.length > 1){
        let game = await findGameByID(req.body.game_id)
        // console.log(comb.length)
        for(let i=0; i<getFollower.length; i++){
        // console.log(getFollower[i].follower_id)
        sendInvitation = await SendInvitationToAll(req.body.uid, getFollower[i].follower_id, req.body.game_id);
        let deviceToken = await findUserByID(getFollower[i])
        // console.log(deviceToken)
        var dataPush={
                     "title": 'Game Invitation',
                     "body": game[0].username + ' invite you in the game with ticket amount : '+game[0].game_amount +" game name : "+ game[0].game_name
                     }
        sendPushNotification(deviceToken[0].device_token,dataPush)
        }
        for(let i=0; i<getFollowing.length; i++){
        // console.log(getFollowing[i].user_id)
        sendInvitation = await SendInvitationToAll(req.body.uid, getFollowing[i].user_id, req.body.game_id);
        let deviceToken = await findUserByID(getFollowing[i])
        // console.log(deviceToken)
        var dataPush={
                     "title": 'Game Invitation',
                     "body": game[0].username + ' invite you in the game with ticket amount : '+game[0].game_amount +" game name : "+ game[0].game_name
                     }
        sendPushNotification(deviceToken[0].device_token,dataPush)
        }
        // console.log(getFollowing[0].user_id)
        }
        res.status(200).json({success:true, msg:'invitation sent to all users'});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});

app.post("/sendSelectedInvite/:token", async (req, res) => {
console.log(req.body)
console.log("invite selected user")
    if (!req.params.token || !req.body.uid || !req.body.game_id|| !req.body.invited_users_id ) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        console.log(req.body)
        let invited_User = [];
        invited_User = await (req.body.invited_users_id).toString().split(",")
        let game = await findGameByID(req.body.game_id)
        // console.log(invited_User)
        for(let i=0; i< invited_User.length; i++ ){
        let checkInvitation = await findUserInvitation(invited_User[i], req.body.game_id);
        if(checkInvitation ==""){
        let sendInvitation = await SendInvitationToAll(req.body.uid, invited_User[i], req.body.game_id);
        let deviceToken = await findUserByID(invited_User[i])
        // console.log(deviceToken)
        var dataPush={
                     "title": 'Game Invitation',
                     "body": game[0].username + ' invite you in the game with ticket amount : '+game[0].game_amount +" game name : "+ game[0].game_name
                     }
        sendPushNotification(deviceToken[0].device_token,dataPush)
        }
        }
        res.status(200).json({success:true, msg:'invitation sent to all users'});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});


app.post("/myInvitationList/:token", async (req, res) => {
console.log(req.body)
console.log("My invitation")
    if (!req.params.token || !req.body.uid ) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        let type=2;
        let myInvitation = await myInvitationList(req.body.uid, type)
        
        if(myInvitation != ""){
        for(i=0; i< myInvitation.length; i++){
        			// let time = checkGame[i].game_time;
        			// let data = time.toString().split(":")
        			// let hr = data[0]	
        			// let min = data[1]
        			let gameDetails = await findGameByID(myInvitation[i].game_id)
        			// console.log(gameDetails)
        			Object.assign(myInvitation[i],{status:gameDetails[0].status},{msg:"You are invited to play the game"},{game_name:gameDetails[0].game_name},{game_amount:gameDetails[0].game_amount},{total_amount:gameDetails[0].total_amount},{game_time:gameDetails[0].game_time},{game_date:gameDetails[0].game_date})
        			}
        }
        // console.log(myInvitation)
        res.status(200).json({success:true, msg:'My invitation List', data:myInvitation});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});



app.post("/userInviteResponce/:token", async (req, res) => {
console.log(req.body)
console.log("invitation Responce")
    if (!req.params.token || !req.body.uid || !req.body.invite_Id || !req.body.responce_type ) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        
        	let resultGame = await findGameByID(req.body.game_id);
        	let resultUser = await findUserByID(req.body.uid);
        	if(req.body.responce_type == 1){
        		let UserPresent = await findUserPresent(req.body.game_id, req.body.uid);
        // console.log(UserPresent)
        			if(UserPresent ==""){
        // console.log(resultUser[0].available_coin)
        				let totalAmount = resultUser[0].available_coin + resultUser[0].available_balance;
        				let game_amount = resultGame[0].game_amount;
        				let total_amount = resultGame[0].total_amount;
        // res.send({ success: true, msg: 'Joined successfully', game_id: resultGame });
        if( game_amount <= totalAmount){
        const game_id = req.body.game_id;
        const ticket = await isGame(10);
        if( game_amount <= resultUser[0].available_coin)
                            	{
        let remainingWallet = resultUser[0].available_coin - game_amount;
        let updateUser = await updateUserCoinWallet(req.body.uid, remainingWallet);
        // res.send({ success: true, msg: 'Amount Deducted from coin wallet successfully', avilable_coin:remainingWallet});
        						}
        else if( game_amount < resultUser[0].available_balance)
        {
        let remainingWallet = resultUser[0].available_balance - game_amount;
        let updateUser = await updateUserBalanceWallet(req.body.uid, remainingWallet);
        // // res.send({ success: true, msg: 'Amount Deducted from Balance wallet successfully', avilable_coin:remainingWallet});
        }
        else{
        let remainingWallet = totalAmount - game_amount;
        let updateUser = await updateUserBothWallet(req.body.uid, remainingWallet);
        // // res.send({ success: true, msg: 'Amount Deducted from both wallet successfully', avilable_coin:remainingWallet});
        }
        const t_id = await isGame(15);
        total_amount = total_amount + game_amount;
        let updateGame = await updateGameAmount(game_id, total_amount)
        // 					// console.log(total_amount)
        let des = "Amount deducted due to Join game table ID: " + game_id + " and Ticket ID : " + ticket;
        let t_type = 0;
        let resultTrans = await insertTrans(t_id, req.body.uid, des, game_amount, ticket, t_type);
        var array = await tambola.generateTicket();
        var tiket = await array.join();
        let joiner =0;
        let resultTicket = await insertTicket(game_id, req.body.uid, joiner,0, ticket, tiket);
		let updateInv = await UpdateGameInv(req.body.uid, req.body.invite_Id,req.body.responce_type )
        // console.log("here")
        res.send({ success: true, msg: 'Joined successfully', game_id: game_id });
        // let deviceToken = await findUserByID(invited_User[i])
        // console.log(deviceToken)
        var dataPush={
                     "title": 'Game Invitation',
                     "body": resultUser[0].username + ' accept your game invitation with ticket amount : '+resultGame[0].game_amount +" game name : "+ resultGame[0].game_name
                     }
        sendPushNotification(resultGame[0].device_token,dataPush)
        
        }
        			else res.send({ success: true, msg: 'Low Balance Recharge Your wallet', avilable_coin:totalAmount});
        					}
        		else res.send({ success: true, msg: 'You have already purchased ticket for this game', ticket_id:UserPresent[0].ticket_id})
        		}else if(req.body.responce_type == 0){
        			let updateInv = await UpdateGameInv(req.body.uid, req.body.invite_Id,req.body.responce_type )
        			res.send({ success: true, msg: 'Request Rejected successfully'});
                var dataPush={
                     "title": 'Game Invitation',
                     "body": resultUser[0].username + ' reject your game invitation with ticket amount : '+resultGame[0].game_amount +" game name : "+ resultGame[0].game_name
                     }
        		sendPushNotification(resultGame[0].device_token,dataPush)
        		}else{
        			res.send({ success: false, msg: 'Something went wrong'});
        		}
        // console.log(req.body)
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});


app.post("/loginSuccess/:token", async (req, res) => {
console.log(req.body)
    if (!req.body.phone || !req.params.token) {res.send({ success: false, msg: "Access Denied" });}
    else {
        try {	
        	let wallet="";let spoUpdate="";let trans="";let checkDist="";
            let ref = await isRef(8);
        	ref = "KC"+ref;
        	let userDetails = await findUserByPhone(req.body.phone);
        	let sponcer = await checkNewUser(req.body.phone);
        	let sponcerDetails = await findUserBySponcerID(sponcer[0].sponcer);
        	// console.log(userDetails, ref, sponcerDetails)
        	if(userDetails[0].ref == null){
            let userUpdate = await updateUserRefSponcer(req.body.phone, ref, sponcerDetails[0].referral_id)
        	let packageAmount = await findPaymentByPhone(req.body.phone)
        	
        		let amount = packageAmount[0].amount/5;
        		checkDist = await checkPaymentDist(userDetails[0].id, sponcerDetails[0].id);
            	// console.log(sponcerDetails,packageAmount,checkDist)
        		if(checkDist == ""){
                	let spo = sponcerDetails[0].referral_id;
                let updateCoin = await UpdateUserCoinByPhone(req.body.phone,packageAmount[0].amount);
                	// console.log(spo)
        			let follow = await newFollower(sponcerDetails[0].id, userDetails[0].id)
        		for(let i=0; i<3; i++){
        				sponcerDetails = await findUserBySponcerID(spo);
                		// console.log(spo,sponcerDetails[0].available_coin)
        				amount = amount/2;
        				wallet = sponcerDetails[0].available_coin + amount;
                		// console.log(wallet,sponcerDetails[0].available_coin)
        				spoUpdate = await updateBySponcerID(spo,wallet);
        				let t_id = await isGame(15);
        				trans = await insertTrans(t_id, sponcerDetails[0].id , "New Registration", amount,2, userDetails[0].id, "1");
        				spo = sponcerDetails[0].sponsor_id;
        				if(!spo){break}
        			}
                	res.status(200).json({ success: true, msg: "Amount distributed"});
        		}else{
        			res.status(200).json({ success: false, msg: "Amount already distributed"});
        		}
            }else{
            	res.status(200).json({ success: false, msg: "Something went wrong due to sponcer null || Try again"})
            }
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Something went wrong" });
        }
    }
});



app.post("/myFollowers/:token", async (req, res) => {
console.log(req.body)
console.log("My follower / following API 1179")
    if (!req.params.token || !req.body.uid || !req.body.listType ) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        let getFollower=""; let check="";let con ="";
        let user = await findUserByID(req.body.uid);
        if(req.body.listType == 0){
        getFollower = await GetFollower(req.body.uid)
        }else{
        getFollower = await GetFollowing(req.body.uid)
        }
        for(let i=0; i<getFollower.length; i++){
        	let cid = getFollower[0].follower_id;
        	for(let j=1; j<=4; j++){
            check = await findUserByID(cid)
            if(check[0].sponsor_id == user[0].referral_id){
            con = ""+j;break
            }else{
            con=""+j;
            }
            if(j==4){con="Connected";}
            }
        Object.assign(getFollower[i],{connection:con})
        }
        res.status(200).json({success:true, msg:'all user list', data: getFollower});
        // console.log(getFollower)
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});



app.post("/earning/:token", async (req, res) => {
console.log(req.body)
console.log("My follower / following API 1179")
    if (!req.params.token || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        let amount=0;
        let level = await levelEarnByID(req.body.uid);
        for(let i =0; i<level.length;i++){amount = (amount + level[i].amount)}
        level=amount;amount=0;
        let table = await gameTableEarnByID(req.body.uid);
        for(let i =0; i<table.length;i++){amount = (amount + table[i].amount)}
        table=amount;amount=0;
        let winner = await gameWinnerEarnByID(req.body.uid);
        for(let i =0; i<winner.length;i++){amount = (amount + winner[i].amount)}
        winner=amount;amount=0;
        res.status(200).json({success:true, msg:'Earning', level:level, gameCreate:table, gamePlay:winner});
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});

app.post("/socialCheck", async (req, res) => {
console.log(req.body)
console.log("check social login with phone security")
    if (!req.body.phone || !req.body.type || !req.body.social_id ) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        	let checkSocial=""
			if(req.body.type == 'fb' || req.body.type == 'google' || req.body.type == 'apple')
            {	
            	if(req.body.type == 'fb') {checkSocial = await CheckSocialFb(req.body.social_id);}
            	if(req.body.type == 'google') {checkSocial = await CheckSocialGoogle(req.body.social_id);}
            	if(req.body.type == 'apple') {checkSocial = await CheckSocialApple(req.body.social_id);}
            	if(checkSocial !=""){
                	if(checkSocial[0].phone == req.body.phone){
            			res.status(200).json({ success: true, msg: "Already Exist" });
                    }else{
                    	res.status(200).json({ success: false, msg: "Social account is connected with another account" });
                    }
                }else{
                	res.status(200).json({ success: true, msg: "New account" });
                }
            }else{
            	res.status(500).json({ success: false, msg: "Try Again" });
            }
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Try Again" });
        }
    }
});








app.post("/requestClaim/:token", async (req, res) => {
console.log(req.body)
    console.log("request claim 835");
	// console.log(req.body);
    if (!req.params.token || !req.body.game_id || !req.body.uid) res.send({ success: false, msg: "Access Denied" });
    else {
        try {
        	let ticketNumber= "";
        	let tiki=[];
        	let data = "";
        	let Number = [];
        	let Numbers = [];
        	let amount=0;
        	tiki = await (req.body.ticket_number).toString().split(",")        	
        	let claim = await claimByID(req.body.claim_type);
        	let FindGame = await findGameByID(req.body.game_id)
        	// console.log(claim)
        	let myTicket = await MyTicket(req.body.game_id,req.body.uid)
            // console.log(myTicket)
        	if(!myTicket) {res.status(500).json({ success: false, msg: "No Ticket found"})}
        	else if(myTicket[0].status == 0) {res.send({ success: false, msg: "Ticket Already in use"})}
        	else { 
            		var ticket_number = [myTicket[0].ticket_number];
        			let data = ticket_number.toString().split(",")
            		let i =""; let j="";
            		if(req.body.claim_type == 1) {i=0;j=8;}
            		else if(req.body.claim_type == 2) {i=9;j=17;}
            		else if(req.body.claim_type == 3) {i=18;j=26;}
            		else if(req.body.claim_type == 4) {i=0;j=26;}
            		else {i=0;j=0;}
            		for(i=i; i<=j; i++){
                    	Number.push(data[i]);
                    }
            		let arrayMatch = await arrayEquals(Number, tiki)
                    // console.log(Number, tiki ,arrayMatch)
        			if(arrayMatch==false){ res.status(500).json({ success: false, msg: "You are trying wrong Mathod"}); }
        			else{
        			let gameNumber = await GameNumber(req.body.game_id);
        			var game_number = [gameNumber[0].game_number];
        			let data = game_number.toString().split(",");                    
        			for(i=0; i<req.body.running_number; i++){
        			Numbers.push(data[i]);
        			}
        			let check = await removeItemAll(Number,"0");
                    // console.log(Numbers, check)
        			let containsAll = check.every(value =>Numbers.includes(value));
                    console.log(containsAll, check,Numbers)
        			if(containsAll ==false){ res.status(500).json({ success: false, msg: "Ticket is not fully matched"});}
        			else{
        			let fetchWinner = await getAllWinnerByGameIDType(req.body.game_id, req.body.claim_type);
                    let fetchAllWinner = await getAllWinnerByGameID(req.body.game_id);
        			let fetchPlayer = await WaitingRoom(req.body.game_id);
        			let totalPlayer = fetchPlayer.length;
                    let TotalWinner = Math.floor(totalPlayer/2)
        			let Prize = await EachLevelWinner();
        			let EachLevelPrizeWinner = Math.floor(totalPlayer/Prize[0].player_each_level);
                    EachLevelPrizeWinner <=1?EachLevelPrizeWinner=1:EachLevelPrizeWinner=EachLevelPrizeWinner;
                    let getDistribution = await Distribution();
                    let distPreAmount = (EachLevelPrizeWinner/getDistribution.length);
                    distPreAmount <=1?distPreAmount=1:distPreAmount=distPreAmount;
                    let already_w=fetchWinner.length;
                    
                    
                    distPreAmount>already_w
                    ?amount=(FindGame[0].total_amount*distPreAmount[0].dist)/(EachLevelPrizeWinner*100)
                    :distPreAmount*2>already_w
                    ?amount=(FindGame[0].total_amount*distPreAmount[1].dist)/(EachLevelPrizeWinner*100)
                    :distPreAmount*3>already_w
                    ?amount=(FindGame[0].total_amount*distPreAmount[2].dist)/(EachLevelPrizeWinner*100)
                    :distPreAmount*4>already_w
                    ?amount=(FindGame[0].total_amount*distPreAmount[3].dist)/(EachLevelPrizeWinner*100)
                    :distPreAmount*5>already_w
                    ?amount=(FindGame[0].total_amount*distPreAmount[4].dist)/(EachLevelPrizeWinner*100)
                    :amount=0;
                    
                    
        			// let TotalWinner = await Math.floor((100*claim[0].distribution)/100);
        			// let EachClaimWinner = (TotalWinner*EachLevelPrizeWinner)/100;
        			// console.log(EachClaimWinner , fetchWinner.length, totalPlayer)
        			if(EachLevelPrizeWinner > fetchWinner.length && TotalWinner >= fetchAllWinner.length){
        			let winnerInsert = await insertWinner(req.body.game_id, gameNumber[0].user_id, req.body.uid, req.body.ticket_id, req.body.claim_type,amount)
        			res.status(200).json({ success: true, msg: "Claim Successfull Applied", winnerInsert:winnerInsert})
        			}else{
        			res.status(500).json({ success: true, msg: "Claim is already full"});
        			}
        			}
        			}
            }
        } catch (e) {
            console.log(e); // console log the error so we can see it in the console
            res.status(500).json({ success: false, msg: "Error No Game Found" });
        }
    }
});

app.listen(PORT, () => {
    console.log(`App is running port ${PORT}...`);
})


app.post("/hash", async (req, res) => {
	let number = await tambola.getHash(req.body.number);
// 	const wordList = [
//   "apple",
//   "banana",
//   "cherry",
//   "dog",
//   "elephant",
//   "fox",
//   "grape",
//   "house",
//   "icecream",
//   "jacket",
//   "kangaroo",
//   "lemon",
//   "monkey",
//   "narwhal",
//   "octopus",
//   "penguin",
//   "quokka",
//   "raccoon",
//   "strawberry",
//   "tiger",
//   "umbrella",
//   "vulture",
//   "walrus",
//   "xylophone",
//   "yak",
//   "zebra"
// ];

// const numKeys = 10; // Change this to the desired number of keys

// const generateRandomKey = () => {
//   const key = [];
//   while (key.length < 16) {
//     const randomIndex = Math.floor(Math.random() * wordList.length);
//     key.push(wordList[randomIndex]);
//   }
//   return key.join(" ");
// };

// const keys = [];

// for (let i = 0; i < numKeys; i++) {
//   keys.push(generateRandomKey());
// }

// // console.log(keys);

	res.status(200).json(number)
});
