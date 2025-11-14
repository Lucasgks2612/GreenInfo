const apiBase = 'http://localhost:3000/api';
const postCommentsCount = {};

function q(id) { return document.getElementById(id); }

function getStoredUserId() {
	return localStorage.getItem('userId');
}

function setStoredUserId(id) {
	localStorage.setItem('userId', id);
}

function renderPost(post) {
    const item = document.createElement('article');
    item.className = 'post-item';

    const header = document.createElement('div');
    header.className = 'post-header';

    const avatar = document.createElement('img');
    avatar.src = post.profile_picture || '/uploads/default.png';
    avatar.alt = post.user_name || 'Usuário';

    const meta = document.createElement('div');
    const name = document.createElement('div');
    name.textContent = post.user_name || 'Usuário';
    name.className = 'post-title';

    meta.appendChild(name);
    header.appendChild(avatar);
    header.appendChild(meta);

    item.appendChild(header);

    if (post.title) {
        const t = document.createElement('div');
        t.textContent = post.title;
        t.style.fontWeight = '600';
        item.appendChild(t);
    }


    if (post.content) {
        const c = document.createElement('div');
        c.className = 'post-content';
        c.textContent = post.content;
        item.appendChild(c);
    }


    if (post.img) {
        const img = document.createElement('img');
        img.className = 'post-image';
        img.src = post.img;
        img.alt = 'imagem do post';
        item.appendChild(img);
    }

    const actions = document.createElement('div');
    actions.style.marginTop = '10px';

    const likeBtn = document.createElement('button');
    likeBtn.className = 'like-btn';
    likeBtn.dataset.postId = post.id;
    likeBtn.textContent = "Like";

    const counts = document.createElement('span');
    counts.className = 'post-counts';
    counts.style.marginLeft = '10px';
    counts.textContent = `${post.likes_count || 0} curtidas • ${post.comments_count || 0} comentários`;

    actions.appendChild(likeBtn);
    actions.appendChild(counts);

    item.appendChild(actions);

    const form = document.createElement('form');
    form.className = 'comment-form';
    form.dataset.postId = post.id;
    form.innerHTML = `
        <input type="text" name="content" placeholder="Escreva um comentário..." required>
        <button type="submit">Enviar</button>
    `;
    item.appendChild(form);

    const list = document.createElement('div');
    list.className = 'comments-list';
    list.id = `comments-${post.id}`;
    item.appendChild(list);

    loadComments(post.id);

    return item;
}

async function fetchPosts() {
	try {
		const res = await fetch(`${apiBase}/posts`);
		if (!res.ok) {
			console.error('API /posts returned', res.status);
			const feedErr = q('posts-feed');
			feedErr.innerHTML = '';
			const errEl = document.createElement('div');
			errEl.textContent = `Erro ${res.status}`;
			feedErr.appendChild(errEl);
			return;
		}

		const data = await res.json();
		console.log('GET /api/posts ->', data);
		const feed = q('posts-feed');
		while (feed.firstChild) feed.removeChild(feed.firstChild);
		if (!data.success) {
			const err = document.createElement('div');
			err.textContent = 'Erro na resposta do servidor ao listar posts.';
			err.style.color = 'red';
			feed.appendChild(err);
			return;
		}

		if (!data.posts || data.posts.length === 0) {
			const empty = document.createElement('div');
			empty.textContent = 'Nenhum post ainda.';
			empty.style.color = '#666';
			empty.style.padding = '12px 0';
			feed.appendChild(empty);
			return;
		}

		data.posts.forEach(p => {
			const el = renderPost(p);
			feed.appendChild(el);
		});
	} catch (err) {
		console.error('Erro ao buscar posts', err);
	}
}

document.addEventListener('click', (e) => {
	if (e.target.classList.contains('like-btn')) {
		const postId = e.target.dataset.postId;
		const countsEl = e.target.nextElementSibling;
		likePost(postId, e.target, countsEl);
	}
});

document.addEventListener('submit', (e) => {
	if (e.target.classList.contains('comment-form')) {
		e.preventDefault();
		const postId = e.target.dataset.postId;
		const content = e.target.querySelector('input[name="content"]').value.trim();
		if (!content) return;

		const list = document.getElementById(`comments-${postId}`);
		const countsEl = e.target.previousElementSibling.querySelector('.post-counts');

		submitComment(postId, content, list, countsEl);

		e.target.reset();
	}
});


async function submitPost() {
	const userId = getStoredUserId() || q('user-id-input').value;
	if (!userId) {
		alert('Defina seu user id no canto superior antes de postar.');
		return;
	}

	const title = q('post-title').value;
	const content = q('post-content').value;
	const fileInput = q('post-image');

	const fd = new FormData();
	if (title) fd.append('title', title);
	if (content) fd.append('content', content);
	if (fileInput.files && fileInput.files[0]) fd.append('image', fileInput.files[0]);

	try {
		const res = await fetch(`${apiBase}/posts`, {
			method: 'POST',
			headers: { 'X-User-Id': userId },
			body: fd
		});
		const data = await res.json();
		if (data.success) {
			q('post-title').value = '';
			q('post-content').value = '';
			q('post-image').value = '';
			fetchPosts();
		} else {
			alert('Erro ao publicar: ' + (data.message || ''));
		}
	} catch (err) {
		console.error('Erro ao publicar', err);
	}
}

document.addEventListener('DOMContentLoaded', () => {

	const stored = getStoredUserId();
	if (stored) {
		q('user-id-input').value = stored;
		q('user-id-input').disabled = true;
	}

	q('set-user-btn').addEventListener('click', () => {
		const v = q('user-id-input').value.trim();
		if (!v) return alert('Informe um user id válido');
		setStoredUserId(v);
		q('user-id-input').disabled = true;
	});

	q('submit-post').addEventListener('click', (e) => {
		e.preventDefault();
		submitPost();
	});

	fetchPosts();
});

async function likePost(postId, btn, countsEl) {
	const userId = getStoredUserId();
	if (!userId) return alert("Defina seu user ID para curtir.");

	const res = await fetch(`${apiBase}/posts/${postId}/like`, {
		method: 'POST',
		headers: { "X-User-Id": userId }
	});

	const data = await res.json();
	if (data.success) {
		const parts = countsEl.textContent.split(' ');
		let likes = parseInt(parts[0]);
		if (data.liked) likes++;
		else likes--;
		countsEl.textContent = `${likes} curtidas • ${postCommentsCount[postId] || 0} comentários`;
	}
}

async function submitComment(postId, content, list, countsEl) {
	const userId = getStoredUserId();
	if (!userId) return alert("Defina seu user ID antes de comentar.");

	const res = await fetch(`${apiBase}/posts/${postId}/comment`, {
		method: 'POST',
		headers: {
			"Content-Type": "application/json",
			"X-User-Id": userId
		},
		body: JSON.stringify({ content })
	});

	const data = await res.json();
	if (data.success) {

		await loadComments(postId);

		const parts = countsEl.textContent.split(' ');
		const likes = parseInt(parts[0]) || 0;
		const comments = postCommentsCount[postId] || 0;
		countsEl.textContent = `${likes} curtidas • ${comments} comentários`;
	}
}

async function loadComments(postId) {
    const list = document.getElementById(`comments-${postId}`);
    if (!list) return;

    const res = await fetch(`${apiBase}/posts/${postId}/comments`);
    const data = await res.json();

    if (!data.success) return;

    postCommentsCount[postId] = data.comments.length;

    list.innerHTML = "";

    data.comments.forEach(c => {
        const el = document.createElement('div');
        el.className = "comment-item";
        el.innerHTML = `
            <div class="comment-header">
                <img src="${c.profile_picture || '/uploads/default.png'}" class="comment-avatar">
                <span class="comment-user">${c.user_name}</span>
            </div>
            <div class="comment-body">${c.content}</div>
        `;
        list.appendChild(el);
    });
}
