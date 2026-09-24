import "./Loader.scss";


const Loader = ({text}) => {
    return (
        <div className="loader-overlay" role="status" aria-live="polite">
            <div className="loader"></div>
            <span>{text}</span>
        </div>
    );
};

export default Loader;