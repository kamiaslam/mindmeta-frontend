import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { getSession } from "helper/authHelper";
import { getScheduleCallList, scheduleCall } from "../../../redux/ApiSlice/callSlice";
import EventModal from "./eventModal";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import { Add, ArrowLeft, ArrowRight } from "@mui/icons-material";
import moment from "moment";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { VIEW_OPTIONS } from "helper/constant";
import SoftInput from "components/SoftInput";
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format: (date, formatStr, options) => format(date, formatStr, { locale: options?.locale }),
  parse: (dateStr, formatStr, options) =>
    parse(dateStr, formatStr, new Date(), { locale: options?.locale }),
  startOfWeek: (date, options) => startOfWeek(date, { locale: options?.locale }),
  getDay: (date) => getDay(date),
  locales,
});

function CalendarComponent() {
  const { meeting } = useSelector((state) => state.call); // Fetch meetings from Redux
  const userInfo = getSession();
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState({}); // State to track expanded descriptions
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");
  const dispatch = useDispatch();

  const handleGetData = async () => {
    await dispatch(getScheduleCallList());
  };
  useEffect(() => {
    handleGetData();
  }, []);

  useEffect(() => {
    let formattedEvents =
      meeting?.map((event) => ({
        ...event,
        start: moment.utc(event.start).local().toDate(),
        end: moment.utc(event.end).local().toDate(),
      })) || [];

    // If current view is 'Agenda', filter events for the selected date
    if (currentView === Views.AGENDA) {
      formattedEvents = formattedEvents.filter(
        (event) =>
          moment(event.start).isSame(selectedDate, "day") ||
          moment(event.end).isSame(selectedDate, "day")
      );
    }

    setFilteredEvents(formattedEvents);
  }, [meeting, currentView, selectedDate]);
  const onPrevClick = useCallback(() => {
    const newDate = moment(selectedDate)
      .subtract(
        currentView === Views.AGENDA ? 1 : currentView === Views.WEEK ? 1 : 1,
        currentView === Views.AGENDA ? "d" : currentView === Views.WEEK ? "w" : "M"
      )
      .toDate();
    setSelectedDate(newDate);
    setExpandedDescriptions({});
  }, [currentView, selectedDate]);

  const onNextClick = useCallback(() => {
    const newDate = moment(selectedDate)
      .add(
        currentView === Views.AGENDA ? 1 : currentView === Views.WEEK ? 1 : 1,
        currentView === Views.AGENDA ? "d" : currentView === Views.WEEK ? "w" : "M"
      )
      .toDate();
    setSelectedDate(newDate);
    setExpandedDescriptions({});
  }, [currentView, selectedDate]);
  const onTodayClick = useCallback(() => {
    setSelectedDate(moment().toDate());
    setExpandedDescriptions({});
  }, []);
  const dateText = useMemo(() => {
    if (currentView === Views.AGENDA) return moment(selectedDate).format("dddd, MMMM DD");
    if (currentView === Views.WEEK) {
      const from = moment(selectedDate)?.startOf("week");
      const to = moment(selectedDate)?.endOf("week");
      return `${from.format("MMMM DD")} to ${to.format("MMMM DD")}`;
    }
    if (currentView === Views.MONTH) {
      return moment(selectedDate).format("MMMM YYYY");
    }
  }, [currentView, selectedDate]);
  const handleScheduleCall = () => {
    setModalOpen(true);
  };

  const handleSaveEvent = (event) => {
    const body = {
      title: event.title,
      patient_id: event?.patient?.value,
      description: event.description,
      call_time: moment(event.callTime).utc(),
      call_duration: event?.callDuration * 60,
    };
    dispatch(scheduleCall({ body })).then((res) => {
      if (res?.payload?.success) {
        setModalOpen(false);
        handleGetData();
        toast.success(res?.payload?.message);
      } else {
        toast.error(res?.payload?.error);
        setModalOpen(false);
      }
    });
  };

  const eventPropGetter = () => ({
    style: {
      backgroundColor: "#66b5a3",
      color: "white",
      borderRadius: "5px",
      padding: "5px",
      margin: "2px 0",
    },
  });
  const toggleReadMore = (eventId) => {
    setExpandedDescriptions((prevState) => ({
      ...prevState,
      [eventId]: !prevState[eventId],
    }));
  };
  const eventRenderer = ({ event }) => {
    const maxLength = 400;
    const description = event?.description;
    const isLongDescription = description?.length > maxLength;
    const isExpanded = expandedDescriptions[event.id] || false;

    const displayDescription = isExpanded
      ? description
      : description?.substring(0, maxLength) + (isLongDescription ? "..." : "");

    return (
      <SoftBox sx={{ cursor: "auto" }}>
        {/* Patient Name Row */}
        <Grid container spacing={1}>
          {/* Key: Patient Name */}
          {currentView === "agenda" && (
            <Grid item xs={1}>
              {" "}
              {/* 3 columns for key */}
              <Typography
                color={currentView === "agenda" ? "#000" : "#fff"}
                fontSize="14px"
                fontWeight={"bold"}
              >
                Patient Name
              </Typography>
            </Grid>
          )}
          {currentView === "agenda" && <Grid item>: &nbsp;</Grid>}
          {/* Value: Darsh Dubai */}
          <Grid item xs={currentView === "agenda" ? 10 : 8.5}>
            {" "}
            {/* 9 columns for value */}
            <Typography color={currentView === "agenda" ? "#000" : "#fff"} fontSize="14px">
              {event?.patient?.label}
            </Typography>
          </Grid>
          {currentView !== "agenda" && (
            <Grid item xs={1} textAlign={"end"}>
              <Typography color={currentView === "agenda" ? "#000" : "#fff"} fontSize="12px">
                {format(new Date(event.start), "hh:mm a")}
              </Typography>
            </Grid>
          )}
        </Grid>

        {/* Title Row */}
        <Grid container spacing={1}>
          {/* Key: Title */}
          {currentView === "agenda" && (
            <Grid item xs={1}>
              <Typography
                color={currentView === "agenda" ? "#000" : "#fff"}
                fontSize="14px"
                fontWeight={"bold"}
              >
                Title:
              </Typography>
            </Grid>
          )}
          {currentView === "agenda" && <Grid item>: &nbsp;</Grid>}
          {/* Value: Free Check-up */}
          <Grid item xs={currentView === "agenda" ? 10 : 12}>
            <Typography color={currentView === "agenda" ? "#000" : "#fff"} fontSize="13px">
              {event?.title}
            </Typography>
          </Grid>
        </Grid>

        {currentView === "agenda" && (
          <>
            <Grid container spacing={1}>
              {/* Key: Description */}
              <Grid item xs={1}>
                <Typography
                  color={currentView === "agenda" ? "#000" : "#fff"}
                  fontSize="14px"
                  fontWeight={"bold"}
                >
                  Description
                </Typography>
              </Grid>
              <Grid item>: &nbsp;</Grid>
              {/* Value: Hypertension Description */}
              <Grid item xs={10}>
                <Typography color="#000" fontSize="13px" display={"inline"}>
                  {displayDescription}
                </Typography>
                {isLongDescription && (
                  <Typography
                    onClick={() => toggleReadMore(event.id)}
                    color={"#000"}
                    fontSize={"12px"}
                    fontWeight={"bold"}
                    sx={{ cursor: "pointer" }}
                    display={"inline"}
                  >
                    {isExpanded ? "Read Less" : "Read More"}
                  </Typography>
                )}
              </Grid>
            </Grid>
            <Grid container spacing={1}>
              {/* Key: Description */}
              <Grid item xs={1}>
                <Typography
                  color={currentView === "agenda" ? "#000" : "#fff"}
                  fontSize="14px"
                  fontWeight={"bold"}
                >
                  Call Duration
                </Typography>
              </Grid>
              <Grid item>: &nbsp;</Grid>
              {/* Value: Hypertension Description */}
              <Grid item xs={10}>
                <Typography color={"#000"} fontSize="13px">
                  {event?.call_duration} minute
                </Typography>
              </Grid>
            </Grid>
          </>
        )}
      </SoftBox>
    );
  };

  return (
    <DashboardLayout>
      <SoftBox pt={3}>
        <SoftBox>
          <Card>
            <div style={{ height: "auto", padding: "10px" }}>
              <Grid container justifyContent="center" alignItems="center" mb={2}>
                <Grid item xs={2}>
                  <Box sx={{ position: "relative", zIndex: 5 }}>
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => {
                        setSelectedDate(date);
                        setExpandedDescriptions({});
                      }}
                      customInput={<input style={{ cursor: "pointer" }} />}
                      className={"input"}
                      peekNextMonth
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      dateFormat="dd-MM-yyyy"
                      onKeyDown={(e) => e.preventDefault()} // Prevent keyboard input
                    />
                  </Box>
                </Grid>
                <Grid
                  item
                  xs={7}
                  container
                  justifyContent="flex-end"
                  alignItems="center"

                  // spacing={2}
                >
                  <Grid item xs={3} sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <SoftButton variant="outlined" color="info" onClick={onTodayClick}>
                      Today
                    </SoftButton>
                  </Grid>
                  <Grid item container xs={7} alignItems="center">
                    <SoftBox sx={{ display: "flex" }}>
                      <IconButton aria-label="Previous" onClick={onPrevClick}>
                        <ArrowLeft />
                      </IconButton>
                      <Box
                        sx={{
                          color: "black",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          // width: 260,
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="h6">{dateText}</Typography>
                      </Box>
                      <IconButton aria-label="Next" onClick={onNextClick}>
                        <ArrowRight />
                      </IconButton>
                    </SoftBox>
                  </Grid>
                </Grid>
                <Grid item xs={3}>
                  <SoftBox display="flex" justifyContent="end" alignItems="center">
                    {userInfo?.role == "care_home" && (
                      <SoftButton
                        variant="gradient"
                        color="info"
                        sx={{
                          marginRight: "10px",
                        }}
                        onClick={handleScheduleCall}
                      >
                        <Add sx={{ marginLeft: "5px" }} /> Schedule Call
                      </SoftButton>
                    )}

                    <ButtonGroup variant="contained">
                      {VIEW_OPTIONS.map(({ id, label }) => (
                        <SoftButton
                          key={id}
                          onClick={() => {
                            setCurrentView(id);
                            id != currentView && setExpandedDescriptions({});
                          }}
                          variant="outlined"
                          color="info"
                          sx={id === currentView ? { color: "#66B5A3" } : { color: "#000" }}
                        >
                          {label}
                        </SoftButton>
                      ))}
                    </ButtonGroup>
                  </SoftBox>
                </Grid>
              </Grid>

              <Calendar
                localizer={localizer}
                events={filteredEvents}
                defaultView={Views.MONTH}
                startAccessor="start"
                endAccessor="end"
                selectable={userInfo.role !== "patient"}
                // onSelectSlot={handleSelectSlot}
                eventPropGetter={eventPropGetter}
                components={{
                  event: eventRenderer,
                }}
                style={{ height: 735, cursor: "default" }}
                view={currentView}
                date={selectedDate}
                onView={setCurrentView}
                onNavigate={setSelectedDate}
                toolbar={false}
                views={["month", "agenda"]}
              />

              {userInfo.role !== "patient" && modalOpen && (
                <EventModal
                  open={modalOpen}
                  handleClose={() => setModalOpen(false)}
                  handleSave={handleSaveEvent}
                  selectedDate={selectedDate}
                />
              )}
            </div>
          </Card>
        </SoftBox>
      </SoftBox>
    </DashboardLayout>
  );
}

export default CalendarComponent;
