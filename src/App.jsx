import { createSignal, Show, For } from 'solid-js';
import * as Sentry from '@sentry/browser';

function App() {
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [isLoggedIn, setIsLoggedIn] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [channels, setChannels] = createSignal([]);
  const [selectedChannel, setSelectedChannel] = createSignal(null);
  
  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = `https://apsmart.in:80/get.php?username=${encodeURIComponent(username())}&password=${encodeURIComponent(password())}&type=m3u_plus&output=ts`;
      const response = await fetch(url);
      if (response.ok) {
        const playlistText = await response.text();
        const parsedChannels = parseM3U(playlistText);
        setChannels(parsedChannels);
        setIsLoggedIn(true);
      } else {
        alert('فشل في جلب قائمة التشغيل. يرجى التحقق من بيانات الاعتماد الخاصة بك.');
      }
    } catch (error) {
      Sentry.captureException(error);
      console.error('خطأ في تسجيل الدخول:', error);
      alert('حدث خطأ. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const parseM3U = (playlist) => {
    const lines = playlist.split('\n');
    const channels = [];
    let currentChannel = {};
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('#EXTINF:')) {
        const info = line.split(',')[1];
        currentChannel.name = info;
      } else if (line && !line.startsWith('#')) {
        currentChannel.url = line;
        channels.push({ ...currentChannel });
        currentChannel = {};
      }
    }
    return channels;
  };

  const logout = () => {
    setUsername('');
    setPassword('');
    setIsLoggedIn(false);
    setChannels([]);
    setSelectedChannel(null);
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4">
      <Show when={!isLoggedIn()}>
        <div class="flex items-center justify-center h-full">
          <div class="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
            <h2 class="text-3xl font-bold mb-6 text-center text-purple-600">أطلس لايف برو</h2>
            <form onSubmit={login} class="space-y-4">
              <input
                type="text"
                placeholder="اسم المستخدم"
                value={username()}
                onInput={(e) => setUsername(e.target.value)}
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent box-border text-right"
                required
              />
              <input
                type="password"
                placeholder="كلمة المرور"
                value={password()}
                onInput={(e) => setPassword(e.target.value)}
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent box-border text-right"
                required
              />
              <button
                type="submit"
                class={`w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${loading() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading()}
              >
                <Show when={loading()}>
                  جاري تسجيل الدخول...
                </Show>
                <Show when={!loading()}>
                  تسجيل الدخول
                </Show>
              </button>
            </form>
          </div>
        </div>
      </Show>
      <Show when={isLoggedIn()}>
        <div class="flex flex-col h-full">
          <div class="flex justify-between items-center mb-4">
            <h1 class="text-4xl font-bold text-purple-600">أطلس لايف برو</h1>
            <button
              class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer"
              onClick={logout}
            >
              تسجيل الخروج
            </button>
          </div>
          <Show when={selectedChannel()}>
            <div class="mb-4">
              <h2 class="text-2xl font-bold mb-2 text-purple-600">{selectedChannel().name}</h2>
              <video
                src={selectedChannel().url}
                controls
                autoplay
                class="w-full max-h-[50vh] rounded-lg shadow-md"
              />
            </div>
          </Show>
          <div class="flex-1 overflow-y-auto">
            <h2 class="text-2xl font-bold mb-2 text-purple-600">قائمة القنوات</h2>
            <div class="space-y-2">
              <For each={channels()}>
                {(channel) => (
                  <div
                    class="bg-white p-4 rounded-lg shadow-md hover:bg-purple-100 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer"
                    onClick={() => setSelectedChannel(channel)}
                  >
                    <p class="text-gray-800 font-semibold text-right">{channel.name}</p>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

export default App;