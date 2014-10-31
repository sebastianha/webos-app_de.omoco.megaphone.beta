/*
MegaPhone - Display text over multiple phones
Version 1.0.0 (14. Mar 2010)

Copyright (C) 2010 Sebastian Hammerl (E-Mail: megaphone@omoco.de)

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License as
published by the Free Software Foundation; either version 3 of
the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, see <http://www.gnu.org/licenses/>.
*/

function MainAssistant() {
	ACTIVE = false;
}

MainAssistant.prototype.setup = function() {
	this.appMenuModel = {
		visible: true,
		items: [
			{ label: $L("About"), command: 'about' },
			{ label: $L("Help"), command: 'tutorial' }
		]
	};
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appMenuModel);
	
	var cookie = new Mojo.Model.Cookie("MegaPhone");
	var Prefs = cookie.get();
	if(Prefs != null)
	{
		this.nduid = Prefs.nduid;
	} else {
		var date = new Date();
		var timestamp = date.getTime();
		this.nduid = timestamp + "_" + Math.round(Math.random()*999999999);
		cookie.put({
			nduid: this.nduid
		});
		Mojo.Controller.stageController.pushScene("tutorial");
	}

	this.spinnerLAttrs = {spinnerSize: 'large'};
	this.spinnerModel = {spinning: true};
	this.controller.setupWidget('spinner1', this.spinnerLAttrs, this.spinnerModel);

	var tattr = {trueLabel: 'Yes', falseLabel: 'No'};
	tModel = {value: true, disabled: false};

	this.controller.setupWidget('publicToggle', tattr, tModel);

	this.channels = [];
	this.selectorsModel = { channel: $L("Refreshing Channels...") };
	
	this.controller.listen('channels_selector', Mojo.Event.propertyChange, this.channelSelectorChanged.bindAsEventListener(this));
	this.controller.setupWidget('channels_selector', {label: $L("Channel"), choices: this.channels, modelProperty:'channel'}, this.selectorsModel);

	this.controller.serviceRequest('palm://com.palm.location', {
		method : 'getCurrentPosition',
		parameters: {
			responseTime: 1,
			subscribe: false
		},
		onSuccess: this.handleServiceResponse1.bind(this),
		onFailure: this.handleServiceResponseError1.bind(this)
	});

	var keysattr = {
		hintText: '',
		textFieldName: 'name', 
		modelProperty: 'original', 
		multiline: false,
		focus: false, 
		maxLength: 20,
	};
	keysmodel = {
		'original' : "Test",
		disabled: false
	};
	this.controller.setupWidget('keys', keysattr, keysmodel);

	var keyattr = {
		hintText: '',
		textFieldName: 'name', 
		modelProperty: 'original', 
		multiline: false,
		focus: false, 
		maxLength: 20,
	};
	keymodel = {
		'original' : "Test",
		disabled: false
	};
	this.controller.setupWidget('key', keyattr, keymodel);
	
	var textattr = {
		hintText: '',
		textFieldName: 'name', 
		modelProperty: 'original', 
		multiline: false,
		focus: false, 
		maxLength: 150,
	};
	textmodel = {
		'original' : "",
		disabled: false
	};
	this.controller.setupWidget('text', textattr, textmodel);

	var textfgattr = {
		hintText: '',
		textFieldName: 'name', 
		modelProperty: 'original', 
		multiline: false,
		focus: false, 
		maxLength: 150,
	};
	textfgmodel = {
		'original' : "ffffff",
		disabled: false
	};
	this.controller.setupWidget('textfgcolor', textfgattr, textfgmodel);

	var textbgattr = {
		hintText: '',
		textFieldName: 'name', 
		modelProperty: 'original', 
		multiline: false,
		focus: false, 
		maxLength: 150,
	};
	textbgmodel = {
		'original' : "000000",
		disabled: false
	};
	this.controller.setupWidget('textbgcolor', textbgattr, textbgmodel);

	var passattr = {
		hintText: '',
		textFieldName: 'name', 
		modelProperty: 'original', 
		multiline: false,
		focus: false, 
		maxLength: 150,
	};
	passmodel = {
		'original' : "",
		disabled: false
	};
	this.controller.setupWidget('pass', passattr, passmodel);
	
	this.controller.listen($('master'),Mojo.Event.tap, this.masterButtonPressed.bind(this));
	this.controller.listen($('reset'),Mojo.Event.tap, this.resetButtonPressed.bind(this));
	this.controller.listen($('slave'),Mojo.Event.tap, this.slaveButtonPressed.bind(this));
	this.controller.listen($('refresh'),Mojo.Event.tap, this.refreshButtonPressed.bind(this));
	this.controller.listen($('display'),Mojo.Event.tap, this.displayButtonPressed.bind(this));
	this.controller.listen($('tomaster'),Mojo.Event.tap, this.tomasterButtonPressed.bind(this));
	this.controller.listen($('toslave'),Mojo.Event.tap, this.toslaveButtonPressed.bind(this));
}

MainAssistant.prototype.refreshButtonPressed = function(event){
	this.selectorsModel.channel = $L("Refreshing Channels...");
	this.controller.modelChanged(this.selectorsModel);
	
	this.controller.serviceRequest('palm://com.palm.location', {
		method : 'getCurrentPosition',
		parameters: {
			responseTime: 1,
			subscribe: false
		},
		onSuccess: this.handleServiceResponse1.bind(this),
		onFailure: this.handleServiceResponseError1.bind(this)
	});
}

MainAssistant.prototype.channelSelectorChanged = function(event){
	keysmodel['original'] = event.value;
	this.controller.modelChanged(keysmodel);
}

MainAssistant.prototype.masterButtonPressed = function(event) {
	var key = keymodel['original'];
	var pass = passmodel['original'];
	if (key != "" && pass != "") {
		$('spinner').style.display = "block";
		this.controller.serviceRequest('palm://com.palm.location', {
			method : 'getCurrentPosition',
			parameters: {
				responseTime: 1,
				subscribe: false
			},
			onSuccess: this.handleServiceResponse.bind(this),
			onFailure: this.handleServiceResponseError.bind(this)
		});
	} else {
		Mojo.Controller.errorDialog("Please fill in key and password!");
	}
}

MainAssistant.prototype.handleServiceResponse = function(response){
	var key = keymodel['original'];
	var text = textmodel['original'];
	var fgcolor = textfgmodel['original'];
	var bgcolor = textbgmodel['original'];
	var pass = passmodel['original'];
	
	var pub = 0;
	if(tModel.value)
		pub = 1;
	
	var url = "http://kirjava.arrowsoft.de/megaphone/?do=set&key=" + key + "&text=" + text + "&pass=" + pass + "&fgcolor=" + fgcolor + "&bgcolor=" + bgcolor + "&lon=" + response.longitude + "&lat=" + response.latitude + "&pub=" + pub;
	var request = new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'false',
		onSuccess: this.MasterRequestSuccess.bind(this),
		onFailure: this.MasterRequestFailure.bind(this)
	});
}
	
MainAssistant.prototype.handleServiceResponseError = function(response){
	$('spinner').style.display = "none";
	Mojo.Controller.errorDialog("Master GPS FAILURE");
}

MainAssistant.prototype.handleServiceResponse1 = function(response){
	var url = "http://kirjava.arrowsoft.de/megaphone/?do=around&lon=" + response.longitude + "&lat=" + response.latitude;
	var request = new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force',
		onSuccess: this.SlaveRequestSuccess1.bind(this),
		onFailure: this.SlaveRequestFailure1.bind(this)
	});
}
	
MainAssistant.prototype.handleServiceResponseError1 = function(response){
	Mojo.Controller.errorDialog("Slave GPS FAILURE");
}

MainAssistant.prototype.tomasterButtonPressed = function(event) {
	$('slavediv').style.display = "none";
	$('masterdiv').style.display = "block";
}

MainAssistant.prototype.toslaveButtonPressed = function(event) {
	$('masterdiv').style.display = "none";
	$('slavediv').style.display = "block";
}

MainAssistant.prototype.MasterRequestSuccess = function(result) {
	$('spinner').style.display = "none";
	if(result.responseText == "wrongpass")
		Mojo.Controller.errorDialog("Wrong Password!");
	else
		this.controller.showAlertDialog({
		onChoose: function(value) {},
		title:"Success",
		message:"Text Set!" + result.responseText,
		allowHTMLMessage: true,
		choices:[ {label:'OK', value:'OK', type:'color'} ]
		});
}

MainAssistant.prototype.MasterRequestFailure = function(result) {
	$('spinner').style.display = "none";
	Mojo.Controller.errorDialog("Master UPLOAD FAILURE");
}

MainAssistant.prototype.SlaveRequestSuccess1 = function(result) {
	this.selectorsModel.choices = result.responseJSON;
	if (result.responseText == "[]") {
		this.selectorsModel.channel = $L("No Channels around!");
		this.controller.modelChanged(this.selectorsModel);
	}
	this.selectorsModel.channel = this.selectorsModel.choices[0].value;
	this.controller.modelChanged(this.selectorsModel);
	keysmodel['original'] = this.selectorsModel.choices[0].value;
	this.controller.modelChanged(keysmodel);
}

MainAssistant.prototype.SlaveRequestFailure1 = function(result) {
	Mojo.Controller.errorDialog("Slave DOWNLOAD FAILURE");
}

MainAssistant.prototype.resetButtonPressed = function(event) {
	var key = keymodel['original'];
	var pass = passmodel['original'];
	
	if (key != "" && pass != "") {
		var url = "http://kirjava.arrowsoft.de/megaphone/?do=res&key=" + key + "&pass=" + pass;
		var request = new Ajax.Request(url, {
			method: 'get',
			evalJSON: 'false',
			onSuccess: this.ResRequestSuccess.bind(this),
			onFailure: this.ResRequestFailure.bind(this)
		});
	} else {
		Mojo.Controller.errorDialog("Please fill in key and password!");
	}
}

MainAssistant.prototype.ResRequestSuccess = function(result) {
	if(result.responseText == "wrongpass")
		Mojo.Controller.errorDialog("Wrong Password!");
	else
		this.controller.showAlertDialog({
		onChoose: function(value) {},
		title:"Success",
		message:"Phones Resetted!",
		allowHTMLMessage: true,
		choices:[ {label:'OK', value:'OK', type:'color'} ]
		});
}

MainAssistant.prototype.ResRequestFailure = function(result) {
	Mojo.Controller.errorDialog("Reset FAILURE");
}

MainAssistant.prototype.slaveButtonPressed = function(event) {
	var key = keysmodel['original'];
	
	if (key != "") {
		this.controller.enableFullScreenMode(true);
		ACTIVE = true;
		this.controller.stageController.setWindowOrientation("left");
		$('display').style.display = "block";
		$('infotext').style.display = "block";
		
		this.refreshText();
	} else {
		Mojo.Controller.errorDialog("Please fill in key!");
	}
}

MainAssistant.prototype.DelRequestSuccess = function(result) {

}

MainAssistant.prototype.DelRequestFailure = function(result) {
	Mojo.Controller.errorDialog("Delete FAILURE");
}

MainAssistant.prototype.displayButtonPressed = function(event) {
	ACTIVE = false;
	
	var key = keysmodel['original'];
	
	var url = "http://kirjava.arrowsoft.de/megaphone/?do=del&key=" + key + "&nduid=" + this.nduid;
	var request = new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'false',
		onSuccess: this.DelRequestSuccess.bind(this),
		onFailure: this.DelRequestFailure.bind(this)
	});
	
	$('display').style.display = "none";
	$('infotext').style.display = "none";
	this.controller.stageController.setWindowOrientation("up");
}

MainAssistant.prototype.refreshText = function(event) {
	if (ACTIVE) {
		var key = keysmodel['original'];
		
		var url = "http://kirjava.arrowsoft.de/megaphone/?do=get&key=" + key + "&nduid=" + this.nduid;
		var request = new Ajax.Request(url, {
			method: 'get',
			evalJSON: 'false',
			onSuccess: this.SlaveRequestSuccess.bind(this),
			onFailure: this.SlaveRequestFailure.bind(this)
		});
	}
}

MainAssistant.prototype.SlaveRequestSuccess = function(result) {
	if (ACTIVE) {
		var pieces = result.responseText.split(";;;;;")[0];
		var mylength = pieces;
		var mytext = result.responseText.split(";;;;;")[1];
		var currentusers = result.responseText.split(";;;;;")[2];
		var wholetext = result.responseText.split(";;;;;")[3];
		var fgcolor = result.responseText.split(";;;;;")[4];
		var bgcolor = result.responseText.split(";;;;;")[5];
		
		var mysize = "50px";
		var myheight = "190px";
		if (mylength == 1) {
			mysize = "480px";
			myheight = "420px";
		}
		if (mylength == 2) {
			mysize = "380px";
			myheight = "365px";
		}
		if (mylength == 3) {
			mysize = "250px";
			myheight = "300px";
		}
		if (mylength == 4) {
			mysize = "190px";
			myheight = "270px";
		}
		if (mylength == 5) {
			mysize = "150px";
			myheight = "250px";
		}
		if (mylength == 6) {
			mysize = "130px";
			myheight = "235px";
		}
		if (mylength == 7) {
			mysize = "110px";
			myheight = "220px";
		}
		
		$('displaytext').style.color = "#" + fgcolor;
		$('display').style.backgroundColor = "#" + bgcolor;
		$('displaytext').style.fontSize = mysize;
		$('displaytext').style.height = myheight;
		$('displaytext').innerHTML = mytext.toUpperCase();
		
		$('infotext').innerHTML = "<center><small>Phones: " + currentusers + " / Text: " + wholetext + "</small></center>";
		
		this.refreshText.bind(this).delay(3);
	}
}

MainAssistant.prototype.SlaveRequestFailure = function(result) {
	Mojo.Controller.errorDialog("Slave FAILURE");
}

MainAssistant.prototype.activate = function(event) {
	Mojo.Controller.stageController.setWindowProperties({ blockScreenTimeout: true });
}

MainAssistant.prototype.deactivate = function(event) {

}

MainAssistant.prototype.cleanup = function(event) {

}

MainAssistant.prototype.handleCommand = function(event){
    if(event.type == Mojo.Event.command) {	
		switch (event.command) {
			case 'about':
				Mojo.Controller.stageController.pushScene("about");
				break;
			case 'tutorial':
				Mojo.Controller.stageController.pushScene("tutorial");
				break;
		}
	}
}