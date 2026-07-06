import 'package:latlong2/latlong.dart';

import 'current_location_stub.dart'
    if (dart.library.html) 'current_location_web.dart';

Future<LatLng?> getCurrentLocation() => getCurrentLocationImpl();
