import React, { useState } from 'react';

const FlightInfoComponent = () => {
    const [flightIata, setFlightIata] = useState('');
    const [flightInfo, setFlightInfo] = useState(null);

    const handleFlightIataChange = (e) => {
        setFlightIata(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`http://localhost:8080/api/flight-info?flightIata=${flightIata}`);
            const data = await response.json();

            setFlightInfo(data);

        } catch (error) {
            console.error('Error fetching flight information:', error);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-center items-center h-screen">
                <div className="w-full max-w-md">
                    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="flightIata">
                                Flight:
                                <input
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="flightIata"
                                    type="text"
                                    value={flightIata}
                                    onChange={handleFlightIataChange}
                                />
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <button
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Get Flight Info
                            </button>
                        </div>
                    </form>
                    {flightInfo && (
                        <div className="bg-white shadow-md rounded p-6">
                            <h2 className="text-xl font-bold mb-4">Flight Information</h2>
                            <p>Flight Number: {flightInfo.response.flight_number}</p>
                            <p>Airline: {flightInfo.response.airline_name}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FlightInfoComponent;
