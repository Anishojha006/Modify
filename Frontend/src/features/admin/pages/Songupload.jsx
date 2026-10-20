import { useState } from "react";
import "../style/Songupload.scss";

const INITIAL_SONGS = [
  { id: 1, title: "Golden Hour", artist: "JVKE", mood: "happy" },
  { id: 2, title: "Weightless", artist: "Marconi Union", mood: "neutral" },
  { id: 3, title: "Rainy Days", artist: "The Mood Collective", mood: "sad" },
];

const Songupload = () => {
  const [songs, setSongs] = useState(INITIAL_SONGS);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [mood, setMood] = useState("happy");
  const [fileName, setFileName] = useState("");

  const handleUpload = (event) => {
    event.preventDefault();
    if (!title.trim() || !artist.trim() || !fileName) return;

    setSongs((currentSongs) => [
      {
        id: Date.now(),
        title: title.trim(),
        artist: artist.trim(),
        mood,
      },
      ...currentSongs,
    ]);
    setTitle("");
    setArtist("");
    setMood("happy");
    setFileName("");
    event.currentTarget.reset();
  };

  const handleDelete = (songId) => {
    setSongs((currentSongs) =>
      currentSongs.filter((song) => song.id !== songId)
    );
  };

  return (
    <main className="song-admin">
      <header className="song-admin__header">
        <a className="song-admin__brand" href="/admin">
          <span className="song-admin__brand-icon" aria-hidden="true">♫</span>
          Moodify
          <span className="song-admin__brand-label">ADMIN</span>
        </a>
        <span className="song-admin__status">Music library</span>
      </header>

      <div className="song-admin__main">
        <div className="song-admin__page-heading">
          <div>
            <p className="song-admin__eyebrow">CONTENT MANAGEMENT</p>
            <h1>Manage your music</h1>
            <p className="song-admin__subtitle">
              Add new tracks and keep your Moodify library in tune.
            </p>
          </div>
          <div className="song-admin__count" aria-live="polite">
            <strong>{songs.length}</strong>
            <span>{songs.length === 1 ? "song" : "songs"} in library</span>
          </div>
        </div>

        <div className="song-admin__notice" role="note">
          This is a UI preview. Changes are temporary and are not saved.
        </div>

        <section className="song-admin__panel" aria-labelledby="upload-title">
          <div className="song-admin__section-heading">
            <span className="song-admin__section-icon" aria-hidden="true">＋</span>
            <div>
              <h2 id="upload-title">Upload a song</h2>
              <p>Add a track and choose the mood it belongs to.</p>
            </div>
          </div>

          <form className="song-admin__form" onSubmit={handleUpload}>
            <div className="song-admin__form-fields">
              <label className="song-admin__field">
                <span>Song title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Golden Hour"
                  required
                />
              </label>
              <label className="song-admin__field">
                <span>Artist</span>
                <input
                  type="text"
                  value={artist}
                  onChange={(event) => setArtist(event.target.value)}
                  placeholder="e.g. JVKE"
                  required
                />
              </label>
              <label className="song-admin__field">
                <span>Mood</span>
                <select
                  value={mood}
                  onChange={(event) => setMood(event.target.value)}
                >
                  <option value="happy">Happy</option>
                  <option value="sad">Sad</option>
                  <option value="angry">Angry</option>
                  <option value="surprised">Surprised</option>
                  <option value="neutral">Neutral</option>
                </select>
              </label>
            </div>

            <label className="song-admin__file">
              <input
                type="file"
                accept="audio/*"
                onChange={(event) =>
                  setFileName(event.target.files?.[0]?.name ?? "")
                }
                required
              />
              <span className="song-admin__file-icon" aria-hidden="true">↑</span>
              <span className="song-admin__file-copy">
                <strong>{fileName || "Choose an audio file"}</strong>
                <small>MP3 or other audio format</small>
              </span>
              <span className="song-admin__browse">Browse files</span>
            </label>

            <button className="song-admin__primary-button" type="submit">
              Add song to library
            </button>
          </form>
        </section>

        <section className="song-admin__panel" aria-labelledby="library-title">
          <div className="song-admin__section-heading song-admin__library-heading">
            <span className="song-admin__section-icon" aria-hidden="true">♫</span>
            <div>
              <h2 id="library-title">Existing songs</h2>
              <p>Review tracks currently shown in this preview.</p>
            </div>
          </div>

          {songs.length ? (
            <div className="song-admin__table-wrap">
              <table className="song-admin__table">
                <thead>
                  <tr>
                    <th scope="col">Song</th>
                    <th scope="col">Mood</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {songs.map((song, index) => (
                    <tr key={song.id}>
                      <td>
                        <div className="song-admin__song">
                          <span
                            className={`song-admin__cover song-admin__cover--${index % 4}`}
                            aria-hidden="true"
                          >
                            ♫
                          </span>
                          <span className="song-admin__song-details">
                            <strong>{song.title}</strong>
                            <small>{song.artist}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`song-admin__mood song-admin__mood--${song.mood}`}>
                          {song.mood}
                        </span>
                      </td>
                      <td>
                        <button
                          className="song-admin__delete"
                          type="button"
                          onClick={() => handleDelete(song.id)}
                          aria-label={`Delete ${song.title}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="song-admin__empty">No songs in the library yet.</p>
          )}
        </section>
      </div>
    </main>
  );
};

export default Songupload;
