package com.bryanlanghendries.navigationoptimizer.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
public class FlightInfoController {

    @Value("${airlabs.api.key}")
    private String airLabsApiKey;

    @CrossOrigin(origins = "http://localhost:3000") // Adjust the origin accordingly
    @GetMapping("/api/flight-info")
    public String getFlightInfo(@RequestParam String flightIata) {
        String airLabsApiUrl = "https://airlabs.co/api/v9/flight?flight_iata=" + flightIata + "&api_key=" + airLabsApiKey;

        RestTemplate restTemplate = new RestTemplate();
        return restTemplate.getForObject(airLabsApiUrl, String.class);
    }
}
