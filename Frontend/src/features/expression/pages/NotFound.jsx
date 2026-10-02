import { Link } from "react-router-dom";
import "./NotFound.scss";

const NotFound = () => {
    return (
        <main className="not-found">
            <div className="not-found-card">

                <div className="error-code">
                    404
                </div>

                <div className="not-found-content">
                    <h1>Page Not Found</h1>

                    <p>
                        Sorry, the page you're looking for doesn't exist
                        or may have been moved.
                    </p>

                    <Link to="/" className="home-button">
                        Back to Home
                    </Link>
                </div>

            </div>
        </main>
    );
};

export default NotFound;