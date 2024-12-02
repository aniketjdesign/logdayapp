export const disableScroll = () => {
  document.body.style.overflow = 'hidden';
  document.body.style.height = '100vh';
  document.body.style.touchAction = 'none';
};

export const enableScroll = () => {
  document.body.style.overflow = '';
  document.body.style.height = '';
  document.body.style.touchAction = '';
};