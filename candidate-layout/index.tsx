import { useState, SyntheticEvent, useEffect, useRef } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const redirectionLinks = ["intern", "full-time", "consultant"];

const CandidateLayout = () => {
  const [value, setValue] = useState(0);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValue(redirectionLinks.indexOf(location.pathname.split("/")[2]));
  }, [location.pathname]);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    navigate(redirectionLinks[newValue]);

    if (inputRef && inputRef?.current) {

      inputRef.current.value = "";
    }
  };

  return (
    <Box width="100%" >
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Box>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            <Tab className="tabs-space start-tab-space" label="Intern" {...a11yProps(0)} />
            <Tab className="tabs-space" label="Full Time" {...a11yProps(1)} />
            <Tab className="tabs-space" label="Consultants" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <Box display="flex" alignItems="center">
          <Typography variant="body1">Total Candidates:</Typography>
          <Typography className="ml-3" variant="body1" >{totalCandidates}</Typography>
        </Box>
      </Box>
      <Outlet context={{ setTotalCandidates, inputRef }} />
    </Box>
  );
};

export default CandidateLayout;