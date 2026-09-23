import "./Loader.scss";


const Loader = () => {
    return (
        <div className="loader-overlay" role="status" aria-live="polite">
            <div className="loader"></div>
            <span>Signing you in...</span>
        </div>
    );
};

export default Loader;