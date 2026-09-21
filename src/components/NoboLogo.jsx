import logoDark from "../assets/nobo-logo-dark.png";
import logoLight from "../assets/nobo-logo-light.png";

// Both files have transparent backgrounds; the light one has dark "ERP · POS · AI" text.
// GlobalStyle shows whichever matches the active theme.
export default function NoboLogo({ className = "", alt = "NOBO ERP" }) {
  return (
    <>
      <img src={logoDark} alt={alt} className={`nobo-logo-dark ${className}`} />
      <img src={logoLight} alt="" aria-hidden="true" className={`nobo-logo-light ${className}`} />
    </>
  );
}
