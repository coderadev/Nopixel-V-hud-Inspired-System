(() => {
    'use strict';

    const RESOURCE = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'codera-hud';

    const post = (name, body = {}) => fetch(`https://${RESOURCE}/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(body)
    }).catch(() => null);

    const elements = {
        playerHud: document.getElementById('player-hud'),
        root: document.getElementById('codera-chat'),
        messages: document.getElementById('chat-messages'),
        bar: document.getElementById('chat-bar'),
        input: document.getElementById('chat-input')
    };

    const defaults = {
        maxLength: 120,
        maxHistory: 50,
        visibleWhenClosed: 6,
        fadeAfter: 8000,
        fadeDuration: 400
    };

    const state = {
        open: false,
        settings: { ...defaults },
        messages: [], // { id, author, message, fading }
        nextId: 1,
        fadeTimers: new Map()
    };

    // Matches the .codera-chat__bar close transition duration in chat.css,
    // so the bar's shrink/fade-out animation has time to finish before the
    // container (and its display: none) removes it from the layout.
    const BAR_CLOSE_MS = 320;
    let mountCloseTimer = null;

    const escapeHtml = (value) => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const updateActiveState = () => {
        const shouldStayMounted = state.open || state.messages.length > 0;
        const wasMounted = elements.playerHud.classList.contains('chat-active');

        if (shouldStayMounted) {
            if (mountCloseTimer) { clearTimeout(mountCloseTimer); mountCloseTimer = null; }
            elements.playerHud.classList.add('chat-active');
        }

        if (state.open && !wasMounted) {
            // First mount: the container was just switched from display:none
            // to flex in this same tick. If we add is-open right now the
            // browser has nothing to transition *from* (it paints straight
            // into the open state), so the bar just pops open instead of
            // sliding in. Force it to paint the closed state first, then
            // flip to is-open on the next frame so the width/opacity
            // transition actually runs.
            elements.root.classList.remove('is-open');
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    elements.root.classList.toggle('is-open', state.open);
                });
            });
        } else {
            elements.root.classList.toggle('is-open', state.open);
        }

        if (shouldStayMounted) return;

        // Closing: keep the container mounted just long enough for the bar's
        // own closing animation (triggered by removing is-open above) to play
        // out, then unmount it.
        if (!mountCloseTimer) {
            mountCloseTimer = setTimeout(() => {
                mountCloseTimer = null;
                elements.playerHud.classList.remove('chat-active');
            }, BAR_CLOSE_MS);
        }
    };

    const render = () => {
        const visible = state.open
            ? state.messages
            : state.messages.slice(-state.settings.visibleWhenClosed);

        elements.messages.innerHTML = visible.map((entry) => `
            <div class="codera-chat__message${entry.type && entry.type !== 'default' ? ` codera-chat__message--${entry.type}` : ''}${entry.fading ? ' is-fading' : ''}" data-id="${entry.id}">
                ${entry.author ? `<span class="codera-chat__message-author">${escapeHtml(entry.author)}:</span>` : ''}<span class="codera-chat__message-text">${escapeHtml(entry.message)}</span>
            </div>
        `).join('');

        updateActiveState();
    };

    const removeMessage = (id) => {
        state.messages = state.messages.filter((entry) => entry.id !== id);
        const timer = state.fadeTimers.get(id);
        if (timer) { clearTimeout(timer); state.fadeTimers.delete(id); }
        render();
    };

    const scheduleFade = (id) => {
        const fadeTimer = setTimeout(() => {
            if (state.open) return; // messages stay put while composing
            const entry = state.messages.find((item) => item.id === id);
            if (!entry) return;
            entry.fading = true;
            render();
            const removeTimer = setTimeout(() => removeMessage(id), state.settings.fadeDuration);
            state.fadeTimers.set(id, removeTimer);
        }, state.settings.fadeAfter);
        state.fadeTimers.set(id, fadeTimer);
    };

    const addMessage = (author, message, msgType) => {
        const id = state.nextId++;
        state.messages.push({ id, author, message, type: msgType || 'default', fading: false });
        if (state.messages.length > state.settings.maxHistory) {
            const removed = state.messages.shift();
            const timer = state.fadeTimers.get(removed.id);
            if (timer) { clearTimeout(timer); state.fadeTimers.delete(removed.id); }
        }
        render();
        if (!state.open) scheduleFade(id);
    };

    const clearMessages = () => {
        state.fadeTimers.forEach((timer) => clearTimeout(timer));
        state.fadeTimers.clear();
        state.messages = [];
        render();
    };

    const openChat = (settings) => {
        state.settings = { ...defaults, ...(settings || {}) };
        applyInputWidth();
        state.open = true;
        // Messages don't fade while composing; cancel any pending fades.
        state.fadeTimers.forEach((timer) => clearTimeout(timer));
        state.fadeTimers.clear();
        state.messages.forEach((entry) => { entry.fading = false; });
        render();
        elements.input.value = '';
        elements.input.focus();
    };

    const closeChat = () => {
        state.open = false;
        elements.input.blur();
        elements.input.value = '';
        render();
        state.messages.forEach((entry) => scheduleFade(entry.id));
    };

    const sendMessage = () => {
        const message = elements.input.value.trim();
        post('codera_chat_send', { message });
        closeChat();
    };

    const cancelChat = () => {
        post('codera_chat_close', {});
        closeChat();
    };

    elements.input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            cancelChat();
        }
    });

    elements.bar.addEventListener('click', () => elements.input.focus());

    window.addEventListener('message', ({ data }) => {
        switch (data.action) {
            case 'chatOpen':
                openChat(data);
                break;
            case 'chatClose':
                closeChat();
                break;
            case 'chatMessage':
                if (data.settings) {
                    state.settings = { ...defaults, ...data.settings };
                    applyInputWidth();
                }
                addMessage(data.author, data.message, data.msgType);
                break;
            case 'chatClear':
                clearMessages();
                break;
            default:
                break;
        }
    });

    const applyInputWidth = () => {
        document.documentElement.style.setProperty('--chat-input-width', `${state.settings.inputWidth || 340}px`);
    };

    applyInputWidth();
})();
