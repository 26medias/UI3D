(function() {
	var uibg = function(element, url, options) {
		var scope = this;
		this.element 	= element;
		this.options 	= _.extend({
			redraw:		false,
			scaleUp:	true
		}, options);
		this.img 		= {
			url:	url,
			width:	0,
			height:	0
		};
		this.load(function() {
			scope.redraw();
			if (scope.options.redraw == 'auto') {
				$(window).resize(function() {
					scope.redraw();;
				});
			}
		});
	}
	uibg.prototype.dom = function(nodeType, appendTo, raw) {
		var element = document.createElement(nodeType);
		if (appendTo != undefined) {
			$(appendTo).append($(element));
		}
		return (raw === true)?element:$(element);
	};
	uibg.prototype.load = function(callback) {
		var scope 	= this;
		var img 	= this.dom('img', $('body'));
		img.attr('src', this.img.url);
		console.log("img",img);
		img.hide();
		img.load(function() {
			scope.img.width 	= $(this).width();
			scope.img.height 	= $(this).height();
			callback();
		});
	}
	uibg.prototype.getScreenSize = function() {
		return {
			width:	$(this.element).width(),
			height:	$(this.element).height()
		};
	}
	uibg.prototype.redraw = function() {
		var containerSize 	= this.getScreenSize();
		var iw 			= this.img.width;
		var ih 			= this.img.height;
		var ir			= iw/ih;
		var cw			= containerSize.width;
		var ch			= containerSize.height;
		var outw;
		var outh;
		if (this.options.scaleUp) {
			if (cw > iw) {
				// zoom in
				outw	= cw;
				outh	= outw/ir;
			} else {
				// zoom out
				outw	= cw;
				outh	= outw/ir;
			}
			if (outh < ch) {
				outh 	= ch;
				outw	= outh*ir;
			}
			this.element.css({
				'background-image':		'url("'+this.img.url+'")',
				'background-position':	'center center',
				'background-repeat':	'no-repeat',
				'background-size':		outw+'px '+outh+'px'
			});
		} else {
			if (cw > iw) {
				// zoom in
				outw	= iw;
				outh	= ih;
			} else {
				// zoom out
				outw	= cw;
				outh	= outw/ir;
			}
			this.element.css({
				'background-image':		'url("'+this.img.url+'")',
				'background-position':	'center center',
				'background-repeat':	'no-repeat',
				'background-size':		outw+'px '+outh+'px'
			});
		}
	}
	
	
	
	
	
	
	
	
	
	
	
	
	function ui3d(element, options) {
		var scope 	= this;
		this.element 		= element;
		this.options		= _.extend({
			redraw:		'auto',
			duration:	1,
			center:		{
				h:		false,
				v:		false,
				ref:	$(window)
			},
			axis:		{
				h:		true,
				v:		true
			}
		}, options);
		
		this.constants	= {
			z:	{
				min:			-100,
				max:			100,
				max_scale:		5,
				opacity_start:	50
			}
		};
		
		this.properties		= this.reset({});	// The final one, used by GSAP
		this._properties	= this.reset({});	// The stable one, used by the user
		this.cssproperties	= {left:0,top:0};	// The final one, used by GSAP for CSS interpolations
		
		this.overwrite		= {
			x:	0
		};
		
		this.element.css({
			position:	'absolute',
			top:		0,
			left:		0
		});
		
		if (this.options.redraw == 'auto') {
			$(window).resize(function() {
				scope.redraw();
			});
		}
		
		
		scope.redraw();
	}
	ui3d.prototype.reset = function(object) {
		return _.extend({
			x:						0,
			y:						0,
			rotationX:				0,
			rotationY:				0,
			rotationZ:				0,
			scale:					1,
			opacity: 				1,
			transformPerspective:	1000
		}, object);
	}
	ui3d.prototype.center = function(h, v, ref) {
		var scope 	= this;
		this.options.center.h = h;
		this.options.center.v = v;
		if (ref) {
			this.options.center.ref = ref;
		}
		this.redraw();
		return this;
	}
	ui3d.prototype.set = function(prop, val, relative) {
		if (relative) {
			this.properties[prop] 	= val*this._properties[prop];
		} else {
			this._properties[prop] 	= val;
			this.properties[prop] 	= val;
		}
		return this;
	}
	ui3d.prototype.incr = function(prop, val) {
		this.properties[prop] += val;
		this._properties[prop] += val;
		return this;
	}
	ui3d.prototype.decr = function(prop, val) {
		this.properties[prop] -= val;
		this._properties[prop] -= val;
		return this;
	}
	ui3d.prototype.multi = function(prop, val) {
		this.properties[prop] *= val;
		this._properties[prop] *= val;
		
		return this;
	}
	ui3d.prototype.rotate = function(axis, value, origin) {
		if (!origin) {
			origin = "left top";
		}
		this.set('rotation'+axis.toUpperCase(), value);
		this.set('transformOrigin', origin);
		return this;
	}
	ui3d.prototype.xalign = function() {
		var original 		= this.properties.x*1;
		
		this.overwrite.x	= original;
		this.redraw();
		/*
		this.element.css({
			left:	original
		});
		this.properties.x = 0;
		this._properties.x = 0;
		//this.redraw();
		console.log("this._properties",this._properties);
		console.log("this.properties",this.properties);
		*/
		return this;
	}
	ui3d.prototype.map = function(x,  in_min,  in_max,  out_min,  out_max) {
		return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	}
	ui3d.prototype.move = function(direction) {
		var dir;
		for (dir in direction) {
			var value 	= direction[dir];
			switch (dir) {
				case "z":
					var opacity;
					var scale;
					
					// Scale calculation
					if (value > 0) {
						scale		= this.map(1+(value/this.constants.z.max), 1, 2, 1, this.constants.z.max_scale);
					} else {
						scale 		= 1+(value/this.constants.z.max);
					}
					
					// Opacity calculation. Has an activation threshold
					if (Math.abs(value) >= this.constants.z.opacity_start) {
						opacity 	= this.map(Math.abs(value)-this.constants.z.opacity_start, 0, this.constants.z.opacity_start, 1, 0);
					} else {
						opacity 	= 1;
					}
					
					this.set('scale', 		scale, true);
					this.set('opacity', 	opacity, true);
				break;
			}
		}
		this.redraw();
		return this;
	}
	ui3d.prototype.redraw = function() {
		var scope 	= this;
		
		if (this.options.center.h) {
			var cw 			= this.options.center.ref.width();
			var ew 			= this.element.outerWidth();
			//this.overwrite.x= (cw-ew)/2;
			this.set('x', (cw-ew)/2);
		}
		if (this.options.center.v) {
			var ch 			= this.options.center.ref.height();
			var eh 			= this.element.outerHeight();
			this.set('y', (ch-eh)/2);
		}
		
		if (this.options.axis.h) {
			var w2						= this.element.outerWidth()/2;
			this.cssproperties.left 	= this.properties.x;
			this.set('x', 0);
		}
		/*if (this.options.axis.v) {
			var h2						= this.element.outerHeight()/2;
			this.cssproperties.top 		= this.properties.y + w2;
			this.set('y', 0-h2);
		}*/
		
		TweenLite.to(this.element, this.options.duration, _.clone(this.cssproperties));
		TweenMax.to(this.element, this.options.duration, _.clone(this.properties));
		
		return this;
	}
	window.ui3d = {
		box:	ui3d,
		bg:		uibg
	};
})();