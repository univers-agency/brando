$(document).ready(function () {
  $('.accordion-tabs-minimal').each(function(index) {
    $(this).children('li').first().children('a').addClass('is-active').next().addClass('is-open').show();
  });

  $('.accordion-tabs-minimal').on('click', '.tab-link', function(event) {
    event.preventDefault();
    activate_tab(this);
  });
});

function activate_tab(obj) {
  if (!$(obj).hasClass('is-active')) {
    // remove `tab-` from obj id
    document.location.hash = $(obj).attr('id').replace('tab-', '');
    var accordionTabs = $(obj).closest('.accordion-tabs-minimal');
    accordionTabs.find('.is-open').removeClass('is-open').hide();

    $(obj).next().toggleClass('is-open').toggle();
    accordionTabs.find('.is-active').removeClass('is-active');
    $(obj).addClass('is-active');
  }
}