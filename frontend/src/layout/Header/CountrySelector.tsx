import { useEffect, useRef, useState } from "react";

interface Country {
  name: string;
  flag: string;
  code: string;
}

interface Props {
  selectedCountry: Country | null;
  countries: Country[];
  onSelect: (country: Country) => void;
}

const CountrySelector = ({ selectedCountry, countries, onSelect }: Props) => {
  const [countryOpen, setCountryOpen] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setCountryOpen(false);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Reset scroll on search
  useEffect(() => {
    if (dropdownRef.current) dropdownRef.current.scrollTop = 0;
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [searchCountry]);

  const filtered = countries.filter((c) =>
    c.name
      .toLowerCase()
      .replace(/\s/g, "")
      .includes(searchCountry.toLowerCase().replace(/\s/g, "")),
  );

  return (
    <div className="header__country">
      <button
        className="header__country-btn"
        onClick={(e) => {
          e.stopPropagation();
          setCountryOpen(!countryOpen);
        }}
      >
        {selectedCountry ? (
          <>
            <img
              src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
              alt={selectedCountry.name}
              width={20}
              height={14}
              style={{ borderRadius: "2px" }}
            />
            {selectedCountry.code}
          </>
        ) : (
          "Loading..."
        )}
      </button>

      {countryOpen && (
        <div className="header__country-dropdown" ref={dropdownRef}>
          <div className="header__country-search">
            <input
              type="text"
              placeholder="Search country..."
              className="header__country-search-input"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setSearchCountry(e.target.value)}
              value={searchCountry}
              autoFocus
            />
          </div>
          <div className="header__country-list" ref={listRef}>
            {filtered.map((country) => (
              <div
                key={country.code}
                className="header__country-item"
                onClick={() => {
                  onSelect(country);
                  setCountryOpen(false);
                  setSearchCountry("");
                }}
              >
                <img
                  src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                  alt={country.name}
                  width={20}
                  height={15}
                />
                {country.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
