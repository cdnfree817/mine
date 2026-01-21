function initPagination(options){
    const containerSelector = options.container || '#movie-list';  
    const basePath = options.basePath || '/';
    const paginationMode = options.paginationMode || 1; 
    let lastLoadedPage = options.currentPage || 1;

    function makeUrl(page){ 
        return page===1 ? basePath : `${basePath}/page/${page}`; 
    }

    function updateRelNext(page){
        $('head link[rel=next]').remove();
        $('<link>', {rel:'next', href: makeUrl(page+1)}).appendTo('head');
    }

    function scrollToContainer(){
        $('html, body').animate({scrollTop: $(containerSelector).offset().top - 20}, 400);
    }

    function loadPage(page, append=false, pushState=true, scroll=false){
        $.ajax({
            url: makeUrl(page),
            type:'GET',
            headers:{'X-Requested-With':'XMLHttpRequest'}
        }).done(function(html){
            const $html = $(html);
            const $newContent = $html.find(containerSelector).html();

            if(append){ 
                $(containerSelector).append($newContent); 
            } else { 
                $(containerSelector).html($newContent);
                if(paginationMode===1){ 
                    $('#pagination-wrapper').html($html.find('#pagination-wrapper').html()); 
                }
            }

            
            if(paginationMode===2){
                let nextBtn = $html.find('#load-more-btn');
                $('#load-more-wrapper').html(nextBtn.length ? nextBtn : '');
            }

            updateRelNext(page);
            if(pushState){ history.pushState({page}, '', makeUrl(page)); }
            lastLoadedPage = Math.max(lastLoadedPage, page);

            if(scroll) scrollToContainer();
        });
    }

    
    if(paginationMode===1){
        $(document).on('click','#pagination a.page-link',function(e){
            e.preventDefault();
            const match=$(this).attr('href').match(/\/page\/(\d+)/);
            const page=match ? parseInt(match[1]) : 1;
            loadPage(page,false,true,true); 
        });
    } else if(paginationMode===2){
        $(document).on('click','#load-more-btn',function(){
            const nextPage=parseInt($(this).data('next-page'));
            loadPage(nextPage,true);
        });
    } else if(paginationMode===3){
        $(window).on('scroll',function(){
            if($(window).scrollTop()+$(window).height()>= $(document).height()-200){
                const nextPage = lastLoadedPage + 1;
                loadPage(nextPage,true,false,false);
                history.replaceState({page:nextPage}, '', makeUrl(nextPage));
                updateRelNext(nextPage);
                lastLoadedPage = nextPage;
            }
        });
    }

    // Handle back/forward
    $(window).on('popstate',function(e){
        const page=(e.originalEvent.state && e.originalEvent.state.page)?e.originalEvent.state.page:1;
        loadPage(page,paginationMode!==1,false,false);
    });
}

function jwplayers(box, movieId) {
  var $box = (typeof box === "string") ? $(box) : box;

  $box.one("click touchstart", function(){
    $box.find(".play-btn").fadeOut(300);
    $box.find("img").fadeTo(300,0.4);
    $box.find(".spinner").fadeIn(200);

    $box.addClass("blur");

    $.ajax({
      type: 'POST',
      url: "/hashcallpro",
      data: { num: movieId, mix: "movies" },
      success: function(response) {
        $box.find("#loadmovies").html(response);
        $box.find("iframe").css({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }).on("load", function(){
          $(this).addClass("show");
          $box.find(".spinner").fadeOut(200);
        });
      }
    });
  });
}

function slugify(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/Ä‘/g, "d").replace(/Ä/g, "d")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}


function initSearch(containerId, inputId, buttonId, baseUrl="/search/") {
    const $container = $(containerId);
    const $input = $(inputId);
    const $button = $(buttonId);

    if ($container.is("form")) {
        $container.on("submit", function(e) {
            e.preventDefault();
            let q = $input.val().trim();
            if(q) window.location.href = baseUrl + slugify(q);
        });
    } else { 
        $button.on("click", function() {
            let q = $input.val().trim();
            if(q) window.location.href = baseUrl + slugify(q);
        });
        $input.on("keypress", function(e){
            if(e.which === 13){ // Enter
                e.preventDefault();
                $button.click();
            }
        });
    }
}

function loadMoreAjax(options){
    let page = 1;
    const perPage = options.perPage;
    history.replaceState({page: 1, html: $(options.list).html()}, '', '');

    $(options.button).click(function(){
        page++;
        $.post(options.url, {page: page, mix: "recent",value:options.values}, function(res){
            if(res.trim() !== ""){
                $(options.list).append(res);
                history.pushState({page: page, html: $(options.list).html()}, '', '');
            } else {
                $(options.button).hide();
            }
        });
    });

    window.addEventListener('popstate', function(e){
        if(e.state){
            $(options.list).html(e.state.html);
            page = e.state.page;
        }
    });
}


function nextMoreAjax(options){
    let page = 1; 
    const perPage = options.perPage;

    history.replaceState({page: 1, html: $(options.list).html()}, '', '');

    $(options.nextmore).click(function(){
        page++;
        $.post(options.url, {page: page, mix: "recent",value:options.values}, function(res){
            if (page>1) {$(options.prevmore).show(); $(options.nextmore).show();} else {$(options.prevmore).hide();}
            if(res.trim() !== ""){
                $(options.list).html(res);
                history.pushState({page: page, html: $(options.list).html()}, '', '');
            } else {
                $(options.nextmore).hide();
            }
        });
    });

    $(options.prevmore).click(function(){
        page--;
        $.post(options.url, {page: page, mix: "recent",value:options.values}, function(res){
            if (page<=1) {$(options.prevmore).hide();} else {$(options.prevmore).show(); $(options.nextmore).show();}
            if(res.trim() !== ""){
                $(options.list).html(res);
                history.pushState({page: page, html: $(options.list).html()}, '', '');
            } else {
                $(options.prevmore).hide();
            }
        });
    });

    window.addEventListener('popstate', function(e){
        if(e.state){
            $(options.list).html(e.state.html);
            page = e.state.page;
        }
    });
}


function getRandomFallback() {
  return fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
}

document.addEventListener('lazybeforeunveil', function(e){
    const el = e.target;

    if(el.tagName.toLowerCase() === 'div' && el.dataset.bg){
        const img = new Image();
        img.src = el.dataset.bg;
        img.onload = function(){
            el.style.backgroundImage = 'url(' + el.dataset.bg + ')';
        };
        img.onerror = function(){
            el.style.backgroundImage = 'url(' + getRandomFallback() + ')';
        };
    }

    // Img
    if(el.tagName.toLowerCase() === 'img' && el.dataset.src){
        el.addEventListener('error', function(){
            el.src = getRandomFallback();
        });
    }
});
