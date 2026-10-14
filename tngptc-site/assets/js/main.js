(function(){
  document.documentElement.classList.remove('no-js');
  // mobile menu
  var btn=document.querySelector('.menu-btn'),nav=document.getElementById('site-nav');
  if(btn&&nav){
    btn.addEventListener('click',function(){var o=nav.classList.toggle('open');btn.setAttribute('aria-expanded',o)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');btn.setAttribute('aria-expanded','false');btn.focus()}});
  }
  // reveal on scroll
  var els=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
    els.forEach(function(el){io.observe(el)});
  }else els.forEach(function(el){el.classList.add('in')});
  // lightbox
  var items=[].slice.call(document.querySelectorAll('[data-lightbox]'));
  if(items.length){
    var lb=document.createElement('div');lb.className='lightbox';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Image viewer');
    lb.innerHTML='<button class="lb-btn lb-close" aria-label="Close">×</button><button class="lb-btn lb-prev" aria-label="Previous image">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb-btn lb-next" aria-label="Next image">›</button>';
    document.body.appendChild(lb);
    var img=lb.querySelector('img'),cap=lb.querySelector('figcaption'),i=0,last=null;
    function show(n){i=(n+items.length)%items.length;var b=items[i];img.src=b.getAttribute('data-src');img.alt=b.getAttribute('data-alt')||'';cap.textContent=b.getAttribute('data-caption')||''}
    function open(n){last=document.activeElement;show(n);lb.classList.add('open');document.body.style.overflow='hidden';lb.querySelector('.lb-close').focus()}
    function close(){lb.classList.remove('open');document.body.style.overflow='';if(last)last.focus()}
    items.forEach(function(b,n){b.addEventListener('click',function(){open(n)})});
    lb.querySelector('.lb-close').onclick=close;lb.querySelector('.lb-prev').onclick=function(){show(i-1)};lb.querySelector('.lb-next').onclick=function(){show(i+1)};
    lb.addEventListener('click',function(e){if(e.target===lb)close()});
    document.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;
      if(e.key==='Escape')close();else if(e.key==='ArrowLeft')show(i-1);else if(e.key==='ArrowRight')show(i+1);
      else if(e.key==='Tab'){var f=lb.querySelectorAll('button');var a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
  }
})();
