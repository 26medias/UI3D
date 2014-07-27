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
		
		this.properties		= this.reset({});
		
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
	ui3d.prototype.set = function(prop, val) {
		this.properties[prop] = val;
		return this;
	}
	ui3d.prototype.incr = function(prop, val) {
		this.properties[prop] += val;
		return this;
	}
	ui3d.prototype.decr = function(prop, val) {
		this.properties[prop] -= val;
		return this;
	}
	ui3d.prototype.multi = function(prop, val) {
		this.properties[prop] *= val;
		
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
					
					this.set('scale', 		scale);
					this.set('opacity', 	opacity);
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
			this.set('x', (cw-ew)/2);
		}
		if (this.options.center.v) {
			var ch 			= this.options.center.ref.height();
			var eh 			= this.element.outerHeight();
			this.set('y', (ch-eh)/2);
		}
		
		TweenMax.to(this.element, this.options.duration, _.clone(this.properties));
		
		return this;
	}
	window.ui3d = {
		box:	ui3d,
		bg:		uibg
	};
})();