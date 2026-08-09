import { useEffect, useId, useRef, useState } from "react";

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
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    const closeDropdown = () => {
      setCountryOpen(false);
      setSearchCountry("");
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDropdown();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (countryOpen) searchInputRef.current?.focus();
  }, [countryOpen]);

  const toggleCountryMenu = () => {
    const nextOpen = !countryOpen;
    setCountryOpen(nextOpen);
    if (!nextOpen) setSearchCountry("");
  };

  const normalizedSearch = searchCountry.trim().toLocaleLowerCase();
  const filtered = countries.filter((country) =>
    country.name.toLocaleLowerCase().includes(normalizedSearch),
  );

  return (
    <div className="header__country" ref={rootRef}>
      <button
        type="button"
        className="header__country-btn"
        onClick={toggleCountryMenu}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-expanded={countryOpen}
        aria-label={`Quốc gia: ${selectedCountry?.name ?? "đang tải"}`}
      >
        {selectedCountry ? (
          <>
            <img
              src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
              alt=""
              width={20}
              height={14}
              loading="lazy"
            />
            {selectedCountry.code}
          </>
        ) : (
          "..."
        )}
      </button>

      {countryOpen && (
        <div className="header__country-dropdown">
          <div className="header__country-search">
            <label className="sr-only" htmlFor={`${listId}-search`}>
              Tìm quốc gia
            </label>
            <input
              ref={searchInputRef}
              id={`${listId}-search`}
              type="search"
              placeholder="Tìm quốc gia..."
              className="header__country-search-input"
              onChange={(event) => setSearchCountry(event.target.value)}
              value={searchCountry}
              maxLength={60}
            />
          </div>
          <div className="header__country-list" id={listId} role="listbox">
            {filtered.length > 0 ? (
              filtered.map((country) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={country.code === selectedCountry?.code}
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
                    alt=""
                    width={20}
                    height={15}
                    loading="lazy"
                  />
                  {country.name}
                </button>
              ))
            ) : (
              <p className="header__country-empty">Không tìm thấy quốc gia.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
