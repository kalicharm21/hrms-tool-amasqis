(function($) {
    "use strict";

    if($(window).width()>767)
        {
        if($('.theiaStickySidebar').length>0)
        {
            $('.theiaStickySidebar').theiaStickySidebar({additionalMarginTop:30});
        }
    }

    //AOS

    AOS.init();

    AOS.init({
        once: true, 
        mirror: true,
    });
    AOS.init({
        disable: function() {
          var maxWidth = 800;
          return window.innerWidth < maxWidth;
        }
      });

    // Sidebar

    if($(window).width() <= 991){
    var Sidemenu = function() {
        this.$menuItem = $('.main-nav a');
    };
        
    function init() {
        var $this = Sidemenu;
        $('.main-nav a').on('click', function(e) {
            if($(this).parent().hasClass('has-submenu')) {
                e.preventDefault();
            }
            if(!$(this).hasClass('submenu')) {
                $('ul', $(this).parents('ul:first')).slideUp(350);
                $('a', $(this).parents('ul:first')).removeClass('submenu');
                $(this).next('ul').slideDown(350);
                $(this).addClass('submenu');
            } else if($(this).hasClass('submenu')) {
                $(this).removeClass('submenu');
                $(this).next('ul').slideUp(350);
            }
        });
    }
        
    // Sidebar Initiate
    init();
    }
    
    $(window).on ('load', function (){
            
        $('#loader').delay(100).fadeOut('slow');
        $('#loader-wrapper').delay(500).fadeOut('slow');
        $('body').delay(500).css({'overflow':'visible'});
    });

   
    $(window).scroll(function() {    
        var scroll = $(window).scrollTop();
    
        if (scroll >= 100) {
            $(".main-header-top").addClass("setactive");
        } else {
            $(".main-header-top").removeClass("setactive");
        }
    });
    $(window).scroll(function() {    
        var scroll = $(window).scrollTop();
    
        if (scroll >= 100) {
            $(".main-menu-head").addClass("setactive");
        } else {
            $(".main-menu-head").removeClass("setactive");
        }
    });
    //Mobile toggle

    $('body').append('<div class="sidebar-overlay"></div>');
    $(document).on('click', '#mobile_btn', function() {
      $('main-wrapper').toggleClass('slide-nav');
      $('.sidebar-overlay').toggleClass('opened');
      $('html').addClass('menu-opened');
      return false;
    });
    
    $(document).on('click', '#menu_close', function() {
        $('html').removeClass('menu-opened');
        $('.sidebar-overlay').removeClass('opened');
        $('main-wrapper').removeClass('slide-nav');
    }); 

    $(document).on('click', '.sidebar-overlay', function() {
      $('html').removeClass('menu-opened');
      $(this).removeClass('opened');
      $('main-wrapper').removeClass('slide-nav');
    });

   // Owl Carousel
    
    if($('#setviewslide').length > 0 ){
		var owl = $('#setviewslide');
			owl.owlCarousel({
			margin: 30,
			dots : false,
			nav: true,
			loop: true,
            navText: [
				'<i class="fas fa-chevron-left"></i>',
				'<i class="fas fa-chevron-right"></i>'
			],
			responsive: {
				0: {
					items: 1
				},
				768 : {
					items: 2
				},
				1170: {
					items: 3
				}
			}
		});
	} 
	
    if($('#setviewslides').length > 0 ){
		var owl = $('#setviewslides');
			owl.owlCarousel({
			margin: 30,
			dots : false,
			nav: true,
			loop: true,
            navText: [
				'<i class="fas fa-chevron-left"></i>',
				'<i class="fas fa-chevron-right"></i>'
			],
			responsive: {
				0: {
					items: 1
				},
				768 : {
					items: 2
				},
				1170: {
					items: 3
				}
			}
		});
	} 
	
	if($('#setviewslideset').length > 0 ){
		var owl = $('#setviewslideset');
			owl.owlCarousel({
			margin: 30,
			dots : false,
			nav: true,
			loop: true,
            navText: [
				'<i class="fas fa-chevron-left"></i>',
				'<i class="fas fa-chevron-right"></i>'
			],
			responsive: {
				0: {
					items: 1
				},
				768 : {
					items: 2
				},
				1170: {
					items: 3
				}
			}
		});
	} 
	
    if($('.pricing-slider').length > 0 ){
		var owl = $('.pricing-slider');
			owl.owlCarousel({
            margin: 30,
            dots : false,
			nav: true,
			navText: [
				'<i class="fas fa-chevron-left"></i>',
				'<i class="fas fa-chevron-right"></i>'
			],
			loop: true,
			responsive: {
				0: {
					items: 1
				},
				768 : {
					items: 2
				},
				1170: {
					items: 3
				}
			}
		});
	} 
	
    if($('.cr-slider').length > 0 ) {
		var owl = $('.cr-slider');
			owl.owlCarousel({
            margin: 30,
			dots : false,
			nav: true,
			navText: [
				'<i class="fas fa-arrow-left"></i>',
				'<i class="fas fa-arrow-right"></i>'
			],
			loop: true,
			responsive: {
				0: {
					items: 1
				},
				768 : {
					items: 1
				},
				1170: {
					items: 1
				}
			}
		});
	} 
	
    if($('.bannercar').length > 0 ){
		var owl = $('.bannercar');
			owl.owlCarousel({
                margin: 30,
			dots : true,
			nav: true,
            navText: [
				'<i class="fas fa-arrow-left"></i>',
				'<i class="fas fa-arrow-right"></i>'
			],
			loop: true,
			responsive: {
				0: {
					items: 1
				},
				768 : {
					items: 1
				},
				1170: {
					items: 1
				}
			}
		});
	} 
	
	if($('#setviewslidespath').length > 0 ){
		var owl = $('#setviewslidespath');
			owl.owlCarousel({
			margin: 30,
			dots : false,
			nav: true,
			loop: true,
            navText: [
				'<i class="fas fa-chevron-left"></i>',
				'<i class="fas fa-chevron-right"></i>'
			],
			responsive: {
				0: {
					items: 1
				},
				768 : {
					items: 2
				},
				1170: {
					items: 3
				}
			}
		});
	} 


})(jQuery); 