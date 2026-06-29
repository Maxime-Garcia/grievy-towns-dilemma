using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class castWaterWall : MonoBehaviour
{
    
    public int damages;
    public float speed;
    public Vector3 direction;

    
    // Start is called before the first frame update
    void Start()
    {
        var pos = Camera.main.WorldToScreenPoint(transform.position);
        var dir = Input.mousePosition - pos;
        var angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;
        transform.rotation = Quaternion.AngleAxis(angle, Vector3.forward);

        Vector2 direction = dir;
        direction.Normalize();
        //GameObject projectile = (GameObject)Instantiate(, pos, Quaternion.identity);
        this.gameObject.GetComponent<Rigidbody2D>().velocity = direction * speed;

        Destroy(gameObject, 0.5f);
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
