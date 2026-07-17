(function () {
  function mkBtn(label, extraStyle) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText = 'font-family:"Jost",sans-serif; cursor:pointer;' + (extraStyle || '');
    return b;
  }

  function open(opts) {
    var ratio = opts.ratio; // width / height
    var outputWidth = opts.outputWidth || 900;
    var outputHeight = Math.round(outputWidth / ratio);

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(2,6,4,0.82); z-index:9999; display:flex; align-items:center; justify-content:center; padding:24px;';

    var box = document.createElement('div');
    box.style.cssText = 'background:#0a0a0a; border:1px solid rgba(201,168,76,0.4); padding:26px; max-width:92vw; box-shadow:0 20px 60px rgba(0,0,0,0.5);';

    var title = document.createElement('div');
    title.textContent = opts.title || 'Ajustar imagen';
    title.style.cssText = "font-family:'Cormorant Garamond', serif; font-size:21px; color:#F5F0E8; margin-bottom:16px; letter-spacing:1px; font-weight:600;";

    var maxFrameW = Math.min(560, window.innerWidth * 0.82, window.innerHeight * 0.55 * ratio);
    var frameWidth = Math.max(220, maxFrameW);
    var frameHeight = frameWidth / ratio;

    var frameWrap = document.createElement('div');
    frameWrap.className = 'eclat-cropper-frame';
    frameWrap.style.cssText = 'position:relative; width:' + frameWidth + 'px; height:' + frameHeight + 'px; overflow:hidden; background:#000; cursor:grab; touch-action:none; border:1px solid rgba(245,240,232,0.25); user-select:none;';

    var img = document.createElement('img');
    img.style.cssText = 'position:absolute; left:0; top:0; transform-origin:0 0; user-select:none; pointer-events:none;';
    img.draggable = false;
    frameWrap.appendChild(img);

    var hint = document.createElement('div');
    hint.textContent = 'Arrastra la imagen para moverla · usa el control o la rueda del mouse para hacer zoom';
    hint.style.cssText = "font-family:'Jost',sans-serif; font-size:11.5px; color:rgba(245,240,232,0.5); margin-top:10px;";

    var controls = document.createElement('div');
    controls.style.cssText = 'display:flex; align-items:center; gap:10px; margin-top:14px;';
    var zoomOutBtn = mkBtn('−', 'width:32px; height:32px; background:transparent; border:1px solid rgba(245,240,232,0.3); color:#F5F0E8; font-size:16px;');
    var zoomSlider = document.createElement('input');
    zoomSlider.type = 'range'; zoomSlider.min = '0'; zoomSlider.max = '100'; zoomSlider.value = '0';
    zoomSlider.style.cssText = 'flex:1; accent-color:#C9A84C;';
    var zoomInBtn = mkBtn('+', 'width:32px; height:32px; background:transparent; border:1px solid rgba(245,240,232,0.3); color:#F5F0E8; font-size:16px;');
    controls.appendChild(zoomOutBtn);
    controls.appendChild(zoomSlider);
    controls.appendChild(zoomInBtn);

    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex; gap:10px; margin-top:20px;';
    var cancelBtn = mkBtn('CANCELAR', 'flex:1; background:transparent; border:1px solid rgba(245,240,232,0.25); color:#F5F0E8; padding:13px 0; font-size:12px; letter-spacing:1.5px;');
    var applyBtn = mkBtn('APLICAR', 'flex:1; background:#C9A84C; color:#071F1A; border:none; padding:13px 0; font-size:12px; letter-spacing:1.5px; font-weight:500;');
    actions.appendChild(cancelBtn);
    actions.appendChild(applyBtn);

    box.appendChild(title);
    box.appendChild(frameWrap);
    box.appendChild(hint);
    box.appendChild(controls);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    var state = { naturalW: 0, naturalH: 0, minScale: 1, scale: 1, x: 0, y: 0, dragging: false, startX: 0, startY: 0, startImgX: 0, startImgY: 0, ready: false };

    function applyTransform() {
      img.style.width = state.naturalW + 'px';
      img.style.height = state.naturalH + 'px';
      img.style.transform = 'translate(' + state.x + 'px,' + state.y + 'px) scale(' + state.scale + ')';
    }

    function clamp() {
      var w = state.naturalW * state.scale;
      var h = state.naturalH * state.scale;
      var minX = frameWidth - w, maxX = 0;
      var minY = frameHeight - h, maxY = 0;
      if (state.x > maxX) state.x = maxX;
      if (state.x < minX) state.x = minX;
      if (state.y > maxY) state.y = maxY;
      if (state.y < minY) state.y = minY;
    }

    function setScale(newScale, cx, cy) {
      var maxScale = state.minScale * 4;
      newScale = Math.max(state.minScale, Math.min(maxScale, newScale));
      var relX = (cx - state.x) / state.scale;
      var relY = (cy - state.y) / state.scale;
      state.scale = newScale;
      state.x = cx - relX * state.scale;
      state.y = cy - relY * state.scale;
      clamp();
      applyTransform();
      var span = state.minScale * 3;
      zoomSlider.value = span > 0 ? String(Math.round(((state.scale - state.minScale) / span) * 100)) : '0';
    }

    var reader = new FileReader();
    reader.onload = function () { img.src = reader.result; };
    reader.readAsDataURL(opts.file);

    img.onload = function () {
      state.naturalW = img.naturalWidth;
      state.naturalH = img.naturalHeight;
      var coverScale = Math.max(frameWidth / state.naturalW, frameHeight / state.naturalH);
      state.minScale = coverScale;
      state.scale = coverScale;
      state.x = (frameWidth - state.naturalW * state.scale) / 2;
      state.y = (frameHeight - state.naturalH * state.scale) / 2;
      state.ready = true;
      applyTransform();
    };

    frameWrap.addEventListener('pointerdown', function (e) {
      if (!state.ready) return;
      state.dragging = true;
      state.startX = e.clientX; state.startY = e.clientY;
      state.startImgX = state.x; state.startImgY = state.y;
      frameWrap.setPointerCapture(e.pointerId);
      frameWrap.style.cursor = 'grabbing';
    });
    frameWrap.addEventListener('pointermove', function (e) {
      if (!state.dragging) return;
      state.x = state.startImgX + (e.clientX - state.startX);
      state.y = state.startImgY + (e.clientY - state.startY);
      clamp();
      applyTransform();
    });
    function endDrag() { state.dragging = false; frameWrap.style.cursor = 'grab'; }
    frameWrap.addEventListener('pointerup', endDrag);
    frameWrap.addEventListener('pointercancel', endDrag);

    frameWrap.addEventListener('wheel', function (e) {
      if (!state.ready) return;
      e.preventDefault();
      var rect = frameWrap.getBoundingClientRect();
      var cx = e.clientX - rect.left, cy = e.clientY - rect.top;
      var delta = e.deltaY < 0 ? 1.08 : 0.93;
      setScale(state.scale * delta, cx, cy);
    }, { passive: false });

    zoomInBtn.addEventListener('click', function () { if (state.ready) setScale(state.scale * 1.15, frameWidth / 2, frameHeight / 2); });
    zoomOutBtn.addEventListener('click', function () { if (state.ready) setScale(state.scale / 1.15, frameWidth / 2, frameHeight / 2); });
    zoomSlider.addEventListener('input', function () {
      if (!state.ready) return;
      var t = Number(zoomSlider.value) / 100;
      var newScale = state.minScale + t * state.minScale * 3;
      setScale(newScale, frameWidth / 2, frameHeight / 2);
    });

    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    cancelBtn.addEventListener('click', function () {
      close();
      if (opts.onCancel) opts.onCancel();
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        close();
        if (opts.onCancel) opts.onCancel();
      }
    });

    applyBtn.addEventListener('click', function () {
      if (!state.ready) return;
      var canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      var ctx = canvas.getContext('2d');
      var scaleFactor = outputWidth / frameWidth;
      ctx.drawImage(
        img,
        0, 0, state.naturalW, state.naturalH,
        state.x * scaleFactor, state.y * scaleFactor,
        state.naturalW * state.scale * scaleFactor, state.naturalH * state.scale * scaleFactor
      );
      var dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      close();
      opts.onDone(dataUrl);
    });
  }

  window.EclatCropper = { open: open };
})();
