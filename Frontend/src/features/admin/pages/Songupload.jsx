import { useState } from "react";
import useAdminSongs from "../hooks/useAdminSongs.js";
import Logout from "../componenets/Logout.jsx";
import "../style/Songupload.scss";

const Songupload = () => {
  const {
    songs,
    loading,
    uploading,
    deletingSongId,
    error,
    handleUpload,
    handleDelete,
  } = useAdminSongs();
  const [mood, setMood] = useState("happy");
  const [file, setFile] = useState(null);

  const onUpload = async (event) => {
    event.preventDefault();
    if (!file) return;

    const form = event.currentTarget;
    const uploaded = await handleUpload({ mood, file });

    if (uploaded) {
      form.reset();
      setFile(null);
      setMood("happy");
    }
  };

  return (
    <main className="song-admin">
      <header className="song-admin__header">
        <a className="song-admin__brand" href="/admin">
          <span className="song-admin__brand-icon" aria-hidden="true">♫</span>
          Moodify
          <span className="song-admin__brand-label">ADMIN</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="song-admin__status">Music library</span>
          <Logout />
        </div>
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

        {error && (
          <div className="song-admin__error" role="alert">
            {error}
          </div>
        )}

        <div className="song-admin__notice" role="note">
          Songs are loaded from the database. Uploads and deletions are saved to your music library.
        </div>

        <section className="song-admin__panel" aria-labelledby="upload-title">
          <div className="song-admin__section-heading">
            <span className="song-admin__section-icon" aria-hidden="true">＋</span>
            <div>
              <h2 id="upload-title">Upload a song</h2>
              <p>Add a track and choose the mood it belongs to.</p>
            </div>
          </div>

          <form className="song-admin__form" onSubmit={onUpload}>
            <div className="song-admin__form-fields">
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
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                required
              />
              <span className="song-admin__file-icon" aria-hidden="true">↑</span>
              <span className="song-admin__file-copy">
                <strong>{file?.name || "Choose an audio file"}</strong>
                <small>MP3 or other audio format</small>
              </span>
              <span className="song-admin__browse">Browse files</span>
            </label>

            <button
              className="song-admin__primary-button"
              type="submit"
              disabled={uploading || !file}
            >
              {uploading ? "Uploading..." : "Add song to library"}
            </button>
          </form>
        </section>

        <section className="song-admin__panel" aria-labelledby="library-title">
          <div className="song-admin__section-heading song-admin__library-heading">
            <span className="song-admin__section-icon" aria-hidden="true">♫</span>
            <div>
              <h2 id="library-title">Existing songs</h2>
              <p>Tracks currently stored in your music library.</p>
            </div>
          </div>

          {loading ? (
            <p className="song-admin__empty" role="status">Loading songs...</p>
          ) : songs.length ? (
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
                    <tr key={song._id}>
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
                            <small>
                              <a href={song.url} target="_blank" rel="noreferrer">
                                Listen to track
                              </a>
                            </small>
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
                          onClick={() => handleDelete(song._id)}
                          disabled={deletingSongId === song._id}
                          aria-label={`Delete ${song.title}`}
                        >
                          {deletingSongId === song._id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="song-admin__empty">No songs have been uploaded yet.</p>
          )}
        </section>
      </div>
    </main>
  );
};

export default Songupload;
