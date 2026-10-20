import "../style/Adminlogin.scss";

const Adminlogin = () => {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <main className="admin-login">
      <form className="admin-login__form" onSubmit={handleSubmit}>
        <h1 className="admin-login__title">Moodify Admin</h1>

        <div className="admin-login__field">
          <label htmlFor="admin-username">Username</label>
          <input
            id="admin-username"
            name="username"
            type="text"
            placeholder="Enter your username"
            autoComplete="username"
            autoCapitalize="none"
            required
          />
        </div>

        <div className="admin-login__field">
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>

        <button className="admin-login__submit" type="submit">
          Login
        </button>
      </form>
    </main>
  );
};

export default Adminlogin;
